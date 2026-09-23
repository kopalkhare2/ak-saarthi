'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type {
  Client,
  Policy,
  Investment,
  Commission,
  Appointment,
  Task,
  ClientDocument,
} from '@/lib/types';

interface AppContextType {
  // Data
  clients: Client[];
  policies: Policy[];
  investments: Investment[];
  commissions: Commission[];
  appointments: Appointment[];
  tasks: Task[];
  documents: ClientDocument[];

  // Trash
  trashedClients: Client[];
  trashedDocuments: ClientDocument[];

  // Client CRUD
  addClient: (c: Client) => void;
  updateClient: (c: Client) => void;
  deleteClient: (id: string) => void;
  restoreClient: (id: string) => void;
  permanentDeleteClient: (id: string) => void;

  // Policy CRUD
  addPolicy: (p: Policy) => void;
  updatePolicy: (p: Policy) => void;
  deletePolicy: (id: string) => void;

  // Investment CRUD
  addInvestment: (i: Investment) => void;
  updateInvestment: (i: Investment) => void;
  deleteInvestment: (id: string) => void;

  // Commission CRUD
  addCommission: (c: Commission) => void;

  // Appointment CRUD
  addAppointment: (a: Appointment) => void;
  updateAppointment: (a: Appointment) => void;
  deleteAppointment: (id: string) => void;

  // Task CRUD
  addTask: (t: Task) => void;
  updateTask: (t: Task) => void;
  deleteTask: (id: string) => void;

  // Document CRUD
  addDocument: (d: ClientDocument) => void;
  uploadDocument: (formData: FormData) => Promise<ClientDocument | null>;
  deleteDocument: (id: string) => void;
  restoreDocument: (id: string) => void;
  permanentDeleteDocument: (id: string) => void;

  // Refresh
  refresh: () => void;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [documents, setDocuments] = useState<ClientDocument[]>([]);
  const [trashedClients, setTrashedClients] = useState<Client[]>([]);
  const [trashedDocuments, setTrashedDocuments] = useState<ClientDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const [
        clientsRes,
        policiesRes,
        investmentsRes,
        commissionsRes,
        appointmentsRes,
        tasksRes,
        documentsRes,
        trashedClientsRes,
        trashedDocsRes,
      ] = await Promise.all([
        fetch('/api/clients').then((r) => r.json()),
        fetch('/api/policies').then((r) => r.json()),
        fetch('/api/investments').then((r) => r.json()),
        fetch('/api/commissions').then((r) => r.json()),
        fetch('/api/appointments').then((r) => r.json()),
        fetch('/api/tasks').then((r) => r.json()),
        fetch('/api/documents').then((r) => r.json()),
        fetch('/api/clients?trash=true').then((r) => r.json()),
        fetch('/api/documents?trash=true').then((r) => r.json()),
      ]);

      setClients(Array.isArray(clientsRes) ? clientsRes : []);
      setPolicies(Array.isArray(policiesRes) ? policiesRes : []);
      setInvestments(Array.isArray(investmentsRes) ? investmentsRes : []);
      setCommissions(Array.isArray(commissionsRes) ? commissionsRes : []);
      setAppointments(Array.isArray(appointmentsRes) ? appointmentsRes : []);
      setTasks(Array.isArray(tasksRes) ? tasksRes : []);
      setDocuments(Array.isArray(documentsRes) ? documentsRes : []);
      setTrashedClients(Array.isArray(trashedClientsRes) ? trashedClientsRes : []);
      setTrashedDocuments(Array.isArray(trashedDocsRes) ? trashedDocsRes : []);
    } catch (error) {
      console.error('Failed to load data from API:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // One-time data load on mount; refresh() is also called explicitly after
    // every mutation, so this effect only needs to run once.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  // ── Client CRUD ──
  const addClient = useCallback(async (c: Client) => {
    try {
      await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(c),
      });
      refresh();
    } catch (e) {
      console.error(e);
    }
  }, [refresh]);

  const updateClient = useCallback(async (c: Client) => {
    try {
      await fetch(`/api/clients/${c.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(c),
      });
      refresh();
    } catch (e) {
      console.error(e);
    }
  }, [refresh]);

  const deleteClient = useCallback(async (id: string) => {
    try {
      await fetch(`/api/clients/${id}`, {
        method: 'DELETE',
      });
      refresh();
    } catch (e) {
      console.error(e);
    }
  }, [refresh]);

  const restoreClient = useCallback(async (id: string) => {
    try {
      await fetch(`/api/clients/${id}/restore`, {
        method: 'POST',
      });
      refresh();
    } catch (e) {
      console.error(e);
    }
  }, [refresh]);

  const permanentDeleteClient = useCallback(async (id: string) => {
    try {
      await fetch(`/api/clients/${id}/permanent`, {
        method: 'DELETE',
      });
      refresh();
    } catch (e) {
      console.error(e);
    }
  }, [refresh]);

  // ── Policy CRUD ──
  const addPolicy = useCallback(async (p: Policy) => {
    try {
      await fetch('/api/policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p),
      });
      refresh();
    } catch (e) {
      console.error(e);
    }
  }, [refresh]);

  const updatePolicy = useCallback(async (p: Policy) => {
    try {
      await fetch(`/api/policies/${p.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p),
      });
      refresh();
    } catch (e) {
      console.error(e);
    }
  }, [refresh]);

  const deletePolicy = useCallback(async (id: string) => {
    try {
      await fetch(`/api/policies/${id}`, {
        method: 'DELETE',
      });
      refresh();
    } catch (e) {
      console.error(e);
    }
  }, [refresh]);

  // ── Investment CRUD ──
  const addInvestment = useCallback(async (i: Investment) => {
    try {
      await fetch('/api/investments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(i),
      });
      refresh();
    } catch (e) {
      console.error(e);
    }
  }, [refresh]);

  const updateInvestment = useCallback(async (i: Investment) => {
    try {
      await fetch(`/api/investments/${i.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(i),
      });
      refresh();
    } catch (e) {
      console.error(e);
    }
  }, [refresh]);

  const deleteInvestment = useCallback(async (id: string) => {
    try {
      await fetch(`/api/investments/${id}`, {
        method: 'DELETE',
      });
      refresh();
    } catch (e) {
      console.error(e);
    }
  }, [refresh]);

  // ── Commission CRUD ──
  const addCommission = useCallback(async (c: Commission) => {
    try {
      await fetch('/api/commissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(c),
      });
      refresh();
    } catch (e) {
      console.error(e);
    }
  }, [refresh]);

  // ── Appointment CRUD ──
  const addAppointment = useCallback(async (a: Appointment) => {
    try {
      await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(a),
      });
      refresh();
    } catch (e) {
      console.error(e);
    }
  }, [refresh]);

  const updateAppointment = useCallback(async (a: Appointment) => {
    try {
      await fetch(`/api/appointments/${a.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(a),
      });
      refresh();
    } catch (e) {
      console.error(e);
    }
  }, [refresh]);

  const deleteAppointment = useCallback(async (id: string) => {
    try {
      await fetch(`/api/appointments/${id}`, {
        method: 'DELETE',
      });
      refresh();
    } catch (e) {
      console.error(e);
    }
  }, [refresh]);

  // ── Task CRUD ──
  const addTask = useCallback(async (t: Task) => {
    try {
      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(t),
      });
      refresh();
    } catch (e) {
      console.error(e);
    }
  }, [refresh]);

  const updateTask = useCallback(async (t: Task) => {
    try {
      await fetch(`/api/tasks/${t.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(t),
      });
      refresh();
    } catch (e) {
      console.error(e);
    }
  }, [refresh]);

  const deleteTask = useCallback(async (id: string) => {
    try {
      await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
      });
      refresh();
    } catch (e) {
      console.error(e);
    }
  }, [refresh]);

  // ── Document CRUD ──
  const addDocument = useCallback(async (d: ClientDocument) => {
    try {
      await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(d),
      });
      refresh();
    } catch (e) {
      console.error(e);
    }
  }, [refresh]);

  // Upload real file
  const uploadDocument = useCallback(async (formData: FormData): Promise<ClientDocument | null> => {
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Upload failed');
      }
      const doc = await res.json();
      refresh();
      return doc;
    } catch (e) {
      console.error(e);
      throw e;
    }
  }, [refresh]);

  const deleteDocument = useCallback(async (id: string) => {
    try {
      await fetch(`/api/documents/${id}`, {
        method: 'DELETE',
      });
      refresh();
    } catch (e) {
      console.error(e);
    }
  }, [refresh]);

  const restoreDocument = useCallback(async (id: string) => {
    try {
      await fetch(`/api/documents/${id}/restore`, {
        method: 'POST',
      });
      refresh();
    } catch (e) {
      console.error(e);
    }
  }, [refresh]);

  const permanentDeleteDocument = useCallback(async (id: string) => {
    try {
      await fetch(`/api/documents/${id}/permanent`, {
        method: 'DELETE',
      });
      refresh();
    } catch (e) {
      console.error(e);
    }
  }, [refresh]);

  return (
    <AppContext.Provider
      value={{
        clients, policies, investments, commissions, appointments, tasks, documents,
        trashedClients, trashedDocuments,
        addClient, updateClient, deleteClient, restoreClient, permanentDeleteClient,
        addPolicy, updatePolicy, deletePolicy,
        addInvestment, updateInvestment, deleteInvestment,
        addCommission,
        addAppointment, updateAppointment, deleteAppointment,
        addTask, updateTask, deleteTask,
        addDocument, uploadDocument, deleteDocument, restoreDocument, permanentDeleteDocument,
        refresh: () => { refresh(); },
        isLoading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
