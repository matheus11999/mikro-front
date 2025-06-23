import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, Clock, Router, Activity } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatDateShort, getTimeAgo } from '@/lib/timezone';

interface MikrotikStatusBadgeProps {
  isOnline: boolean;
  minutosOffline?: number | null;
  ultimoHeartbeat?: string | null;
  version?: string | null;
  uptime?: string | null;
  showDetails?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function MikrotikStatusBadge({
  isOnline,
  minutosOffline,
  ultimoHeartbeat,
  version,
  uptime,
  showDetails = false,
  size = 'md'
}: MikrotikStatusBadgeProps) {
  
  const getStatusConfig = () => {
    if (!ultimoHeartbeat) {
      return {
        label: 'Nunca Conectou',
        color: 'text-gray-600',
        bgColor: 'bg-gray-100',
        borderColor: 'border-gray-200',
        icon: <Router className="w-3 h-3" />,
        pulse: false
      };
    }

    if (isOnline) {
      return {
        label: 'Online',
        color: 'text-green-700',
        bgColor: 'bg-green-100',
        borderColor: 'border-green-200',
        icon: <Wifi className="w-3 h-3" />,
        pulse: true
      };
    }

    return {
      label: 'Offline',
      color: 'text-red-700',
      bgColor: 'bg-red-100',
      borderColor: 'border-red-200',
      icon: <WifiOff className="w-3 h-3" />,
      pulse: false
    };
  };

  const statusConfig = getStatusConfig();

  const formatLastSeen = () => {
    if (!ultimoHeartbeat) return 'Nunca conectou';
    return getTimeAgo(ultimoHeartbeat);
  };

  const getTooltipContent = () => {
    const lines = [];
    
    lines.push(`Status: ${statusConfig.label}`);
    lines.push(`Último heartbeat: ${formatLastSeen()}`);
    
    if (ultimoHeartbeat) {
      lines.push(`Data/hora: ${formatDateShort(ultimoHeartbeat)}`);
    }
    
    if (minutosOffline && minutosOffline > 0) {
      lines.push(`Offline há: ${minutosOffline} minutos`);
    }
    
    if (version) {
      lines.push(`Versão: ${version}`);
    }
    
    if (uptime) {
      lines.push(`Uptime: ${uptime}`);
    }

    return lines.join('\n');
  };

  const badgeClasses = `
    inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full
    ${statusConfig.color} ${statusConfig.bgColor} ${statusConfig.borderColor} border
    ${statusConfig.pulse ? 'animate-pulse' : ''}
    ${size === 'sm' ? 'text-xs px-1.5 py-0.5' : ''}
    ${size === 'lg' ? 'text-sm px-3 py-1.5' : ''}
  `;

  const badge = (
    <Badge className={badgeClasses}>
      {statusConfig.icon}
      {statusConfig.label}
      {minutosOffline && minutosOffline > 15 && (
        <span className="ml-1 text-xs opacity-75">
          ({minutosOffline}m)
        </span>
      )}
    </Badge>
  );

  if (showDetails) {
    return (
      <div className="flex flex-col gap-1">
        {badge}
        {(version || uptime) && (
          <div className="text-xs text-gray-500 space-y-0.5">
            {version && (
              <div className="flex items-center gap-1">
                <Activity className="w-3 h-3" />
                {version}
              </div>
            )}
            {uptime && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {uptime}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent>
          <div className="whitespace-pre-line text-sm">
            {getTooltipContent()}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Componente para estatísticas resumidas
export function MikrotikStatusSummary({
  total,
  online,
  offline,
  nunca_conectou,
  porcentagem_online
}: {
  total: number;
  online: number;
  offline: number;
  nunca_conectou: number;
  porcentagem_online: number;
}) {
  return (
    <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-2">
        <Router className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-medium">Total: {total}</span>
      </div>
      
      <div className="flex items-center gap-2">
        <Wifi className="w-4 h-4 text-green-600" />
        <span className="text-sm text-green-700 font-medium">Online: {online}</span>
      </div>
      
      <div className="flex items-center gap-2">
        <WifiOff className="w-4 h-4 text-red-600" />
        <span className="text-sm text-red-700 font-medium">Offline: {offline}</span>
      </div>
      
      {nunca_conectou > 0 && (
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-600" />
          <span className="text-sm text-gray-700 font-medium">Nunca conectou: {nunca_conectou}</span>
        </div>
      )}
      
      <div className="ml-auto">
        <span className="text-sm font-semibold text-blue-600">
          {porcentagem_online}% online
        </span>
      </div>
    </div>
  );
} 