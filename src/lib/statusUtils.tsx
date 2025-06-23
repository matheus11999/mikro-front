import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  AlertCircle,
  Wifi
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export type VendaStatus = 
  | 'aprovado' 
  | 'pendente' 
  | 'processando' 
  | 'autorizado' 
  | 'rejeitado' 
  | 'cancelado' 
  | 'expirado' 
  | 'reembolsado' 
  | 'chargeback';

export interface StatusConfig {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ReactNode;
  category: 'success' | 'pending' | 'failed' | 'problematic';
}

export const getStatusConfig = (status: string): StatusConfig => {
  switch (status) {
    case 'aprovado':
      return {
        label: 'Aprovado',
        color: 'text-green-800',
        bgColor: 'bg-green-100',
        borderColor: 'border-green-200',
        icon: <CheckCircle2 className="w-3 h-3" />,
        category: 'success'
      };
    
    case 'pendente':
      return {
        label: 'Aguardando Pagamento',
        color: 'text-yellow-800',
        bgColor: 'bg-yellow-100',
        borderColor: 'border-yellow-200',
        icon: <Clock className="w-3 h-3 animate-pulse" />,
        category: 'pending'
      };
    
    case 'processando':
      return {
        label: 'Processando',
        color: 'text-blue-800',
        bgColor: 'bg-blue-100',
        borderColor: 'border-blue-200',
        icon: <Clock className="w-3 h-3 animate-pulse" />,
        category: 'pending'
      };
    
    case 'autorizado':
      return {
        label: 'Autorizado',
        color: 'text-indigo-800',
        bgColor: 'bg-indigo-100',
        borderColor: 'border-indigo-200',
        icon: <CheckCircle2 className="w-3 h-3" />,
        category: 'pending'
      };
    
    case 'rejeitado':
      return {
        label: 'Rejeitado',
        color: 'text-red-800',
        bgColor: 'bg-red-100',
        borderColor: 'border-red-200',
        icon: <AlertTriangle className="w-3 h-3" />,
        category: 'failed'
      };
    
    case 'cancelado':
      return {
        label: 'Cancelado',
        color: 'text-red-800',
        bgColor: 'bg-red-100',
        borderColor: 'border-red-200',
        icon: <AlertCircle className="w-3 h-3" />,
        category: 'failed'
      };
    
    case 'expirado':
      return {
        label: 'Expirado',
        color: 'text-gray-800',
        bgColor: 'bg-gray-100',
        borderColor: 'border-gray-200',
        icon: <Clock className="w-3 h-3" />,
        category: 'failed'
      };
    
    case 'reembolsado':
      return {
        label: 'Reembolsado',
        color: 'text-orange-800',
        bgColor: 'bg-orange-100',
        borderColor: 'border-orange-200',
        icon: <AlertTriangle className="w-3 h-3" />,
        category: 'problematic'
      };
    
    case 'chargeback':
      return {
        label: 'Chargeback',
        color: 'text-purple-800',
        bgColor: 'bg-purple-100',
        borderColor: 'border-purple-200',
        icon: <AlertTriangle className="w-3 h-3" />,
        category: 'problematic'
      };
    
    default:
      return {
        label: status || 'Desconhecido',
        color: 'text-gray-800',
        bgColor: 'bg-gray-100',
        borderColor: 'border-gray-200',
        icon: <AlertCircle className="w-3 h-3" />,
        category: 'failed'
      };
  }
};

export const StatusBadge: React.FC<{ status: string; showIcon?: boolean }> = ({ 
  status, 
  showIcon = true 
}) => {
  const config = getStatusConfig(status);
  
  return (
    <Badge className={`${config.bgColor} ${config.color} ${config.borderColor}`}>
      {showIcon && <span className="mr-1">{config.icon}</span>}
      {config.label}
    </Badge>
  );
};

export const StatusSpan: React.FC<{ status: string; showIcon?: boolean; emoji?: boolean }> = ({ 
  status, 
  showIcon = true,
  emoji = false
}) => {
  const config = getStatusConfig(status);
  
  const getEmoji = (status: string) => {
    switch (status) {
      case 'aprovado': return '✅';
      case 'pendente': return '⏳';
      case 'processando': return '🔄';
      case 'autorizado': return '🔒';
      case 'rejeitado': return '❌';
      case 'cancelado': return '🚫';
      case 'expirado': return '⏰';
      case 'reembolsado': return '↩️';
      case 'chargeback': return '⚠️';
      default: return '❓';
    }
  };
  
  return (
    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${config.bgColor} ${config.color}`}>
      {emoji ? getEmoji(status) : (showIcon && config.icon)} {config.label}
    </span>
  );
};

export const getRowStyleByStatus = (status: string): string => {
  const config = getStatusConfig(status);
  
  switch (config.category) {
    case 'success':
      return 'bg-green-50 border-l-4 border-l-green-400';
    case 'pending':
      return 'bg-yellow-50 border-l-4 border-l-yellow-400';
    case 'problematic':
      return 'bg-purple-50 border-l-4 border-l-purple-400';
    case 'failed':
      return 'bg-red-50 border-l-4 border-l-red-400';
    default:
      return '';
  }
};

export const getValueColorByStatus = (status: string): string => {
  const config = getStatusConfig(status);
  
  switch (config.category) {
    case 'success':
      return 'text-green-600';
    case 'pending':
      return 'text-yellow-700';
    case 'problematic':
      return 'text-purple-600';
    case 'failed':
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
};

export const getIconStyleByStatus = (status: string): { bgClass: string; icon: React.ReactNode; textColor: string } => {
  const config = getStatusConfig(status);
  
  switch (config.category) {
    case 'success':
      return {
        bgClass: 'bg-green-100',
        icon: <Wifi className="w-4 h-4 text-green-600" />,
        textColor: 'text-green-600'
      };
    case 'pending':
      return {
        bgClass: 'bg-yellow-100',
        icon: <Clock className="w-4 h-4 text-yellow-600 animate-pulse" />,
        textColor: 'text-yellow-600'
      };
    case 'problematic':
      return {
        bgClass: 'bg-purple-100',
        icon: <AlertTriangle className="w-4 h-4 text-purple-600" />,
        textColor: 'text-purple-600'
      };
    case 'failed':
      return {
        bgClass: 'bg-red-100',
        icon: <AlertTriangle className="w-4 h-4 text-red-600" />,
        textColor: 'text-red-600'
      };
    default:
      return {
        bgClass: 'bg-gray-100',
        icon: <AlertTriangle className="w-4 h-4 text-gray-600" />,
        textColor: 'text-gray-600'
      };
  }
};

export const isStatusPending = (status: string): boolean => {
  return ['pendente', 'processando', 'autorizado'].includes(status);
};

export const isStatusApproved = (status: string): boolean => {
  return status === 'aprovado';
};

export const isStatusFailed = (status: string): boolean => {
  return ['rejeitado', 'cancelado', 'expirado'].includes(status);
};

export const isStatusProblematic = (status: string): boolean => {
  return ['reembolsado', 'chargeback'].includes(status);
}; 