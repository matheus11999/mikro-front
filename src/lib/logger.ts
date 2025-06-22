// Sistema de logging avançado para debug e monitoramento
export class Logger {
  private static instance: Logger;
  private logs: Array<{
    timestamp: string;
    level: 'info' | 'warn' | 'error' | 'debug';
    component: string;
    message: string;
    data?: any;
  }> = [];

  private constructor() {
    this.setupGlobalErrorHandling();
    this.exposeToWindow();
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private setupGlobalErrorHandling() {
    // Capturar erros não tratados
    window.addEventListener('unhandledrejection', (event) => {
      this.error('UnhandledPromiseRejection', event.reason, {
        promise: event.promise,
        stack: event.reason?.stack
      });
    });

    window.addEventListener('error', (event) => {
      this.error('GlobalError', event.message, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      });
    });
  }

  private exposeToWindow() {
    if (typeof window !== 'undefined') {
      (window as any).logger = {
        getLogs: () => this.logs,
        clearLogs: () => this.clear(),
        exportLogs: () => this.exportLogs(),
        debugComponent: (component: string) => this.getComponentLogs(component)
      };
    }
  }

  private formatMessage(level: string, component: string, message: string): string {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const emoji = {
      info: '🔵',
      warn: '🟡', 
      error: '🔴',
      debug: '🟣'
    }[level] || '⚪';
    
    return `${emoji} [${timestamp}] [${component}] ${message}`;
  }

  info(component: string, message: string, data?: any) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'info' as const,
      component,
      message,
      data
    };
    
    this.logs.push(logEntry);
    console.log(this.formatMessage('info', component, message), data || '');
  }

  warn(component: string, message: string, data?: any) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'warn' as const,
      component,
      message,
      data
    };
    
    this.logs.push(logEntry);
    console.warn(this.formatMessage('warn', component, message), data || '');
  }

  error(component: string, message: string, data?: any) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'error' as const,
      component,
      message,
      data
    };
    
    this.logs.push(logEntry);
    console.error(this.formatMessage('error', component, message), data || '');
  }

  debug(component: string, message: string, data?: any) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'debug' as const,
      component,
      message,
      data
    };
    
    this.logs.push(logEntry);
    console.debug(this.formatMessage('debug', component, message), data || '');
  }

  // Métodos específicos para diferentes tipos de operações
  apiCall(component: string, method: string, url: string, data?: any) {
    this.info(component, `API ${method} ${url}`, data);
  }

  apiResponse(component: string, method: string, url: string, success: boolean, data?: any) {
    if (success) {
      this.info(component, `API ${method} ${url} - SUCCESS`, data);
    } else {
      this.error(component, `API ${method} ${url} - FAILED`, data);
    }
  }

  componentMount(component: string, props?: any) {
    this.debug(component, 'Component mounted', props);
  }

  componentUnmount(component: string) {
    this.debug(component, 'Component unmounted');
  }

  loadingStart(component: string, operation: string) {
    this.info(component, `Loading started: ${operation}`);
  }

  loadingEnd(component: string, operation: string, success: boolean = true) {
    if (success) {
      this.info(component, `Loading completed: ${operation}`);
    } else {
      this.error(component, `Loading failed: ${operation}`);
    }
  }

  stateChange(component: string, stateName: string, oldValue: any, newValue: any) {
    this.debug(component, `State change: ${stateName}`, { old: oldValue, new: newValue });
  }

  getComponentLogs(component: string) {
    return this.logs.filter(log => log.component === component);
  }

  getErrorLogs() {
    return this.logs.filter(log => log.level === 'error');
  }

  getRecentLogs(minutes: number = 5) {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000).toISOString();
    return this.logs.filter(log => log.timestamp > cutoff);
  }

  clear() {
    this.logs = [];
    console.clear();
    this.info('Logger', 'Logs cleared');
  }

  exportLogs() {
    const logsText = this.logs.map(log => 
      `[${log.timestamp}] [${log.level.toUpperCase()}] [${log.component}] ${log.message}${
        log.data ? '\n' + JSON.stringify(log.data, null, 2) : ''
      }`
    ).join('\n\n');
    
    const blob = new Blob([logsText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pix-mikro-logs-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    this.info('Logger', 'Logs exported to file');
  }

  // Monitor de performance
  startTimer(component: string, operation: string): string {
    const timerId = `${component}-${operation}-${Date.now()}`;
    const startTime = performance.now();
    
    (window as any).__PERFORMANCE_TIMERS__ = (window as any).__PERFORMANCE_TIMERS__ || {};
    (window as any).__PERFORMANCE_TIMERS__[timerId] = startTime;
    
    this.debug(component, `Timer started: ${operation}`, { timerId });
    return timerId;
  }

  endTimer(timerId: string, component: string, operation: string) {
    const timers = (window as any).__PERFORMANCE_TIMERS__ || {};
    const startTime = timers[timerId];
    
    if (startTime) {
      const duration = performance.now() - startTime;
      delete timers[timerId];
      
      if (duration > 1000) {
        this.warn(component, `Slow operation: ${operation} took ${duration.toFixed(2)}ms`);
      } else {
        this.debug(component, `Operation completed: ${operation} in ${duration.toFixed(2)}ms`);
      }
    }
  }
}

// Instância global
export const logger = Logger.getInstance();

// Hook React para facilitar uso
export function useLogger(componentName: string) {
  return {
    info: (message: string, data?: any) => logger.info(componentName, message, data),
    warn: (message: string, data?: any) => logger.warn(componentName, message, data),
    error: (message: string, data?: any) => logger.error(componentName, message, data),
    debug: (message: string, data?: any) => logger.debug(componentName, message, data),
    apiCall: (method: string, url: string, data?: any) => logger.apiCall(componentName, method, url, data),
    apiResponse: (method: string, url: string, success: boolean, data?: any) => logger.apiResponse(componentName, method, url, success, data),
    loadingStart: (operation: string) => logger.loadingStart(componentName, operation),
    loadingEnd: (operation: string, success?: boolean) => logger.loadingEnd(componentName, operation, success),
    startTimer: (operation: string) => logger.startTimer(componentName, operation),
    endTimer: (timerId: string, operation: string) => logger.endTimer(timerId, componentName, operation),
    mount: (props?: any) => logger.componentMount(componentName, props),
    unmount: () => logger.componentUnmount(componentName)
  };
}

// Comandos do console para debug
if (typeof window !== 'undefined') {
  console.log(`
🔧 Debug Commands Available:
- logger.getLogs() - Ver todos os logs
- logger.clearLogs() - Limpar logs
- logger.exportLogs() - Exportar logs para arquivo
- logger.debugComponent('ComponentName') - Ver logs de um componente específico
- window.debugSupabase() - Debug configuração Supabase
- window.testSupabaseConnection() - Testar conexão Supabase
  `);
} 