import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import EmployeeService from '@/services/EmployeeService';

const employeesKey = ['employees'];

export function useEmployeesList({ page = 1, search = '', status = '', perPage = 15 }) {
  return useQuery({
    queryKey: [...employeesKey, 'list', { page, search, status, perPage }],
    queryFn: () => EmployeeService.list({ page, search, employment_status: status, perPage }),
    placeholderData: (previousData) => previousData,
  });
}

export function useEmployee(uuid) {
  return useQuery({
    queryKey: [...employeesKey, 'detail', uuid],
    queryFn: () => EmployeeService.show(uuid),
    enabled: !!uuid,
  });
}

export function useEmployeeProfile(uuid) {
  return useQuery({
    queryKey: [...employeesKey, 'profile', uuid],
    queryFn: () => EmployeeService.getProfile(uuid),
    enabled: !!uuid,
  });
}

export function useEmployeeAccess(uuid) {
  return useQuery({
    queryKey: [...employeesKey, 'access', uuid],
    queryFn: () => EmployeeService.getAccess(uuid),
    enabled: !!uuid,
  });
}

export function useEmployeeDocuments(uuid, { page = 1, perPage = 15 } = {}) {
  return useQuery({
    queryKey: [...employeesKey, 'documents', uuid, { page, perPage }],
    queryFn: () => EmployeeService.listDocuments(uuid, { page, perPage }),
    enabled: !!uuid,
  });
}

export function useEmployeeContracts(uuid, { page = 1, perPage = 15 } = {}) {
  return useQuery({
    queryKey: [...employeesKey, 'contracts', uuid, { page, perPage }],
    queryFn: () => EmployeeService.listContracts(uuid, { page, perPage }),
    enabled: !!uuid,
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => EmployeeService.store(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeesKey });
    },
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, data }) => EmployeeService.update(uuid, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [...employeesKey, 'detail', variables.uuid] });
      queryClient.invalidateQueries({ queryKey: employeesKey });
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, data }) => EmployeeService.updateProfile(uuid, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [...employeesKey, 'profile', variables.uuid] });
    },
  });
}

export function useCreateDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, data }) => EmployeeService.storeDocument(uuid, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [...employeesKey, 'documents', variables.uuid] });
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, docUuid }) => EmployeeService.destroyDocument(uuid, docUuid),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [...employeesKey, 'documents', variables.uuid] });
    },
  });
}

export function useCreateContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, data }) => EmployeeService.storeContract(uuid, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [...employeesKey, 'contracts', variables.uuid] });
    },
  });
}

export function useDeleteContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, contractUuid }) => EmployeeService.destroyContract(uuid, contractUuid),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [...employeesKey, 'contracts', variables.uuid] });
    },
  });
}

export function useInviteEmployee() {
  return useMutation({
    mutationFn: ({ uuid, email }) => EmployeeService.invite(uuid, email),
  });
}
