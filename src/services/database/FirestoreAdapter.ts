import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  startAfter as firestoreStartAfter,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  runTransaction,
  onSnapshot,
  WhereFilterOp,
  OrderByDirection,
  DocumentData,
  QueryConstraint as FirestoreQueryConstraint,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import {
  IDatabase,
  ITransaction,
  QueryConstraint,
  OrderByConstraint,
  QueryOptions,
  BatchOperation,
} from './IDatabase';

export class FirestoreAdapter implements IDatabase {
  async get<T>(collectionName: string, id: string): Promise<T | null> {
    const docRef = doc(db, collectionName, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return {
      id: docSnap.id,
      ...this.convertTimestamps(docSnap.data()),
    } as T;
  }

  async query<T>(collectionName: string, options: QueryOptions): Promise<T[]> {
    const collectionRef = collection(db, collectionName);
    const constraints: FirestoreQueryConstraint[] = [];

    if (options.where) {
      options.where.forEach((constraint) => {
        constraints.push(
          where(
            constraint.field,
            constraint.operator as WhereFilterOp,
            constraint.value
          )
        );
      });
    }

    if (options.orderBy) {
      options.orderBy.forEach((order) => {
        constraints.push(
          orderBy(order.field, order.direction as OrderByDirection)
        );
      });
    }

    if (options.limit) {
      constraints.push(firestoreLimit(options.limit));
    }

    if (options.startAfter) {
      constraints.push(firestoreStartAfter(options.startAfter));
    }

    const q = query(collectionRef, ...constraints);
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...this.convertTimestamps(doc.data()),
    })) as T[];
  }

  async create<T>(
    collectionName: string,
    data: Omit<T, 'id'>,
    id?: string
  ): Promise<string> {
    const dataWithTimestamp = {
      ...data,
      created_at: Timestamp.now(),
      updated_at: Timestamp.now(),
    };

    if (id) {
      const docRef = doc(db, collectionName, id);
      await setDoc(docRef, dataWithTimestamp);
      return id;
    } else {
      const docRef = await addDoc(
        collection(db, collectionName),
        dataWithTimestamp
      );
      return docRef.id;
    }
  }

  async update(
    collectionName: string,
    id: string,
    data: Partial<any>
  ): Promise<void> {
    const docRef = doc(db, collectionName, id);
    const dataWithTimestamp = {
      ...data,
      updated_at: Timestamp.now(),
    };
    await updateDoc(docRef, dataWithTimestamp);
  }

  async delete(collectionName: string, id: string): Promise<void> {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
  }

  async batch(operations: BatchOperation[]): Promise<void> {
    const batch = writeBatch(db);

    for (const operation of operations) {
      const docRef = operation.id
        ? doc(db, operation.collection, operation.id)
        : doc(collection(db, operation.collection));

      switch (operation.type) {
        case 'create':
          batch.set(docRef, {
            ...operation.data,
            created_at: Timestamp.now(),
            updated_at: Timestamp.now(),
          });
          break;
        case 'update':
          batch.update(docRef, {
            ...operation.data,
            updated_at: Timestamp.now(),
          });
          break;
        case 'delete':
          batch.delete(docRef);
          break;
      }
    }

    await batch.commit();
  }

  async transaction<T>(
    callback: (txn: ITransaction) => Promise<T>
  ): Promise<T> {
    return runTransaction(db, async (firestoreTxn) => {
      const txnAdapter: ITransaction = {
        get: async <T>(collectionName: string, id: string): Promise<T | null> => {
          const docRef = doc(db, collectionName, id);
          const docSnap = await firestoreTxn.get(docRef);

          if (!docSnap.exists()) {
            return null;
          }

          return {
            id: docSnap.id,
            ...this.convertTimestamps(docSnap.data()),
          } as T;
        },
        set: (collectionName: string, id: string, data: any) => {
          const docRef = doc(db, collectionName, id);
          firestoreTxn.set(docRef, {
            ...data,
            created_at: Timestamp.now(),
            updated_at: Timestamp.now(),
          });
        },
        update: (collectionName: string, id: string, data: Partial<any>) => {
          const docRef = doc(db, collectionName, id);
          firestoreTxn.update(docRef, {
            ...data,
            updated_at: Timestamp.now(),
          });
        },
        delete: (collectionName: string, id: string) => {
          const docRef = doc(db, collectionName, id);
          firestoreTxn.delete(docRef);
        },
      };

      return callback(txnAdapter);
    });
  }

  onSnapshot<T>(
    collectionName: string,
    id: string,
    callback: (data: T | null) => void
  ): () => void {
    const docRef = doc(db, collectionName, id);

    return onSnapshot(docRef, (docSnap) => {
      if (!docSnap.exists()) {
        callback(null);
        return;
      }

      callback({
        id: docSnap.id,
        ...this.convertTimestamps(docSnap.data()),
      } as T);
    });
  }

  onQuerySnapshot<T>(
    collectionName: string,
    options: QueryOptions,
    callback: (data: T[]) => void
  ): () => void {
    const collectionRef = collection(db, collectionName);
    const constraints: FirestoreQueryConstraint[] = [];

    if (options.where) {
      options.where.forEach((constraint) => {
        constraints.push(
          where(
            constraint.field,
            constraint.operator as WhereFilterOp,
            constraint.value
          )
        );
      });
    }

    if (options.orderBy) {
      options.orderBy.forEach((order) => {
        constraints.push(
          orderBy(order.field, order.direction as OrderByDirection)
        );
      });
    }

    if (options.limit) {
      constraints.push(firestoreLimit(options.limit));
    }

    const q = query(collectionRef, ...constraints);

    return onSnapshot(q, (querySnapshot) => {
      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...this.convertTimestamps(doc.data()),
      })) as T[];
      callback(data);
    });
  }

  private convertTimestamps(data: DocumentData): any {
    const converted: any = {};

    for (const key in data) {
      if (data[key] instanceof Timestamp) {
        converted[key] = data[key];
      } else if (data[key] && typeof data[key] === 'object') {
        converted[key] = this.convertTimestamps(data[key]);
      } else {
        converted[key] = data[key];
      }
    }

    return converted;
  }
}

export const firestoreDb = new FirestoreAdapter();
