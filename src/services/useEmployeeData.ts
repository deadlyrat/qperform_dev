// src/services/useEmployeeData.ts
// Hook for fetching and caching employee data from Dataverse

import { useState, useEffect } from 'react';
import { getEmployeeByEmail, getEmployeesByEmails, type DataverseEmployee } from './dataverseService';

/**
 * Hook to fetch employee data for a single email
 */
export function useEmployeeData(email: string | undefined) {
  const [employee, setEmployee] = useState<DataverseEmployee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadEmployee() {
      if (!email) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await getEmployeeByEmail(email);

        if (isMounted) {
          setEmployee(data);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load employee:', err);
        if (isMounted) {
          setError(err as Error);
          setLoading(false);
        }
      }
    }

    loadEmployee();

    return () => {
      isMounted = false;
    };
  }, [email]);

  return { employee, loading, error };
}

/**
 * Hook to fetch employee data for multiple emails (batch)
 * More efficient for lists/tables with many employees
 */
export function useEmployeesData(emails: string[]) {
  const [employees, setEmployees] = useState<Map<string, DataverseEmployee>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadEmployees() {
      if (emails.length === 0) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await getEmployeesByEmails(emails);

        if (isMounted) {
          setEmployees(data);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load employees:', err);
        if (isMounted) {
          setError(err as Error);
          setLoading(false);
        }
      }
    }

    loadEmployees();

    return () => {
      isMounted = false;
    };
  }, [emails.join(',')]); // Re-run when email list changes

  return { employees, loading, error };
}

/**
 * Hook to enrich performance data with employee information
 * Takes an array of records with email/agent_email fields and adds employee data
 */
export function useEnrichedPerformanceData<T extends { agent_email?: string; [key: string]: any }>(
  data: T[]
) {
  const emails = data.map(item => item.agent_email).filter(Boolean) as string[];
  const { employees, loading, error } = useEmployeesData(emails);

  const enrichedData = data.map(item => {
    const employee = item.agent_email ? employees.get(item.agent_email) : null;
    return {
      ...item,
      employee: employee || null,
      employeeName: employee?.fullname || item.agent_name || 'Unknown',
      employeeTitle: employee?.jobtitle || null,
    };
  });

  return { enrichedData, loading, error };
}
