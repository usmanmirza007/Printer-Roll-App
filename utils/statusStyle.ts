import { CustomerStatus, OrderStatus } from "@/lib/types";

export const getOrderStatusStyle = (st: OrderStatus, isDark: boolean = false) => {
  switch (st) {
    case 'Delivered':
      return { bg: isDark ? '#064E3B' : '#ECFDF5', text: isDark ? '#A7F3D0' : '#047857' };
    case 'In Progress':
      return { bg: isDark ? '#1E3A8A' : '#EFF6FF', text: isDark ? '#BFDBFE' : '#1D4ED8' };
    case 'Pending':
      return { bg: isDark ? '#78350F' : '#FFFBEB', text: isDark ? '#FDE68A' : '#B45309' };
    case 'Invoiced':
      return { bg: isDark ? '#78350F' : '#FFFBEB', text: isDark ? '#FDE68A' : '#B45309' };
    case 'Cancelled':
      return { bg: isDark ? '#991B1B' : '#FEF2F2', text: isDark ? '#FCA5A5' : '#B91C1C' };
    default:
      return { bg: isDark ? '#334155' : '#F1F5F9', text: isDark ? '#CBD5E1' : '#475569' };
  }
};


export const getCustomerStatusStyle = (status: CustomerStatus, isDark: boolean = false) => {
  switch (status) {
    case 'Active':
      return { bg: isDark ? '#064E3B' : '#ECFDF5', text: isDark ? '#A7F3D0' : '#047857' };

    case 'Follow-up Required':
      return { bg: isDark ? '#78350F' : '#FFFBEB', text: isDark ? '#FDE68A' : '#B45309' };

    case 'Inactive':
      return { bg: isDark ? '#334155' : '#F1F5F9', text: isDark ? '#94A3B8' : '#64748B' };

    case 'Blocked':
      return { bg: isDark ? '#7F1D1D' : '#FEF2F2', text: isDark ? '#FECACA' : '#B91C1C' };

    default:
      return { bg: isDark ? '#334155' : '#F1F5F9', text: isDark ? '#CBD5E1' : '#475569' };
  }
};