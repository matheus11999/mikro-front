import React, { useState, useEffect } from 'react';
import { 
  Router, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Users,
  MoreHorizontal,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Settings,
  DollarSign,
  Key,
  Copy,
  Eye,
  EyeOff,
  Download,
  Activity,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { MikrotikStatusBadge } from './MikrotikStatusBadge';
import { useMikrotikStatus } from '../hooks/useMikrotikStatus';

interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
  name?: string;
}

interface Mikrotik {
  id: string;
  nome: string;
  provider_name?: string;
  status: string;
  cliente_id?: string;
  criado_em: string;
  profitpercentage: number;
  api_token?: string;
  api_token_masked?: string;
}

interface Plan {
  id: string;
  nome: string;
  preco: number;
  duracao: number;
  mikrotik_id: string;
  criado_em: string;
}

interface Cliente {
  id: string;
  nome: string;
  email: string;
  role: string;
}

interface MikrotiksManagementProps {
  currentUser?: User;
}

const MikrotiksManagement = ({ currentUser }: MikrotiksManagementProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPlansModal, setShowPlansModal] = useState(false);
  const [showAddPlanModal, setShowAddPlanModal] = useState(false);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [selectedMikrotik, setSelectedMikrotik] = useState<Mikrotik | null>(null);
  const [editingMikrotik, setEditingMikrotik] = useState<Mikrotik | null>(null);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [showToken, setShowToken] = useState(false);
  const [generatingToken, setGeneratingToken] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [selectedInstallMikrotik, setSelectedInstallMikrotik] = useState<Mikrotik | null>(null);
  
  const { mikrotiks: mikrotiksStatus } = useMikrotikStatus();
  const { toast } = useToast();
  
  const [mikrotiks, setMikrotiks] = useState<Mikrotik[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    nome: '',
    provider_name: '',
    profitpercentage: 10,
    status: 'Ativo',
    cliente_id: ''
  });

  const [showLinkClientModal, setShowLinkClientModal] = useState(false);
  const [linkingMikrotik, setLinkingMikrotik] = useState<Mikrotik | null>(null);
  
  const [planFormData, setPlanFormData] = useState({
    nome: '',
    preco: '',
    duracao: 60
  });
  
  const [filterStatus, setFilterStatus] = useState<'all' | 'Ativo' | 'Inativo'>('all');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    return () => {
      setLoading(false);
      setError('');
      setSuccess('');
    };
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Para admins, buscar todos os dados
      if (currentUser?.role === 'admin') {
        const [mikrotiksResult, clientesResult] = await Promise.all([
          supabase.from('mikrotiks').select('*').order('criado_em', { ascending: false }),
          supabase.from('clientes').select('id, nome, email, role')
        ]);
        
        if (mikrotiksResult.error) throw mikrotiksResult.error;
        if (clientesResult.error) throw clientesResult.error;
        
        setMikrotiks(mikrotiksResult.data || []);
        setClientes(clientesResult.data || []);
      } else {
        // Para usuários normais, usar Supabase diretamente
        let mikrotiksQuery = supabase.from('mikrotiks').select('*');
        
        if (currentUser?.id) {
          mikrotiksQuery = mikrotiksQuery.eq('cliente_id', currentUser.id);
        }
        
        const mikrotiksResult = await mikrotiksQuery.order('criado_em', { ascending: false });
        
        if (mikrotiksResult.error) throw mikrotiksResult.error;
        
        setMikrotiks(mikrotiksResult.data || []);
        setClientes([]);
      }
      
    } catch (err: any) {
      console.error('Erro ao carregar dados:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setTimeout(() => setLoading(false), 100);
    }
  };

  const handleRegenerateToken = async (mikrotik: Mikrotik) => {
    if (!currentUser || currentUser.role !== 'admin') {
      toast({
        title: "Acesso negado",
        description: "Apenas administradores podem regenerar tokens",
        variant: "destructive"
      });
      return;
    }

    try {
      setGeneratingToken(true);
      
      const response = await fetch(`/api/admin/mikrotik/${mikrotik.id}/regenerate-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao regenerar token');
      }

      const data = await response.json();
      
      setMikrotiks(prev => prev.map(m => 
        m.id === mikrotik.id 
          ? { ...m, api_token: data.data.novo_token }
          : m
      ));

      if (selectedMikrotik?.id === mikrotik.id) {
        setSelectedMikrotik(prev => prev ? { ...prev, api_token: data.data.novo_token } : null);
      }

      toast({
        title: "Token regenerado",
        description: `Novo token gerado para ${mikrotik.nome}`,
      });

    } catch (err: any) {
      console.error('Erro ao regenerar token:', err);
      toast({
        title: "Erro",
        description: "Erro ao regenerar token",
        variant: "destructive"
      });
    } finally {
      setGeneratingToken(false);
    }
  };

  const handleCopyToken = async (token: string) => {
    try {
      await navigator.clipboard.writeText(token);
      toast({
        title: "Token copiado",
        description: "Token copiado para a área de transferência",
      });
    } catch (err) {
      toast({
        title: "Erro",
        description: "Erro ao copiar token",
        variant: "destructive"
      });
    }
  };

  const handleShowInstallationCode = (mikrotik: Mikrotik) => {
    if (!mikrotik.api_token) {
      toast({
        title: "Token necessário",
        description: "Este MikroTik precisa de um token para gerar o código de instalação",
        variant: "destructive"
      });
      return;
    }
    setSelectedInstallMikrotik(mikrotik);
    setShowInstallModal(true);
  };

  const handleCopyCommand = async (command: string, commandName: string) => {
    try {
      await navigator.clipboard.writeText(command);
      toast({
        title: "Comando copiado!",
        description: `${commandName} copiado para a área de transferência`,
      });
    } catch (err) {
      toast({
        title: "Erro",
        description: "Erro ao copiar comando",
        variant: "destructive"
      });
    }
  };

  const handleCopyAllCommands = async (mikrotik: Mikrotik) => {
    const allCommands = [
      `# INSTALAÇÃO COMPLETA SISTEMA PIX - ${mikrotik.nome}`,
      `# MikroTik ID: ${mikrotik.id}`,
      `# Token: ${mikrotik.api_token}`,
      `# Execute os comandos na ordem abaixo:`,
      ``,
      `# 1. Script Verificador (40s)`,
      `/system script add name="pix-verificador" source=":local apiUrl \\"https://api.lucro.top/api/recent-sales\\"; :local mikrotikId \\"${mikrotik.id}\\"; :local apiToken \\"${mikrotik.api_token}\\"; :log info \\"PIX iniciado\\"; :local macs \\"\\"; :for tentativa from=1 to=5 do={ :log info \\"Tentativa \\$tentativa\\"; :local jsonData \\"{\\\\\\"mikrotik_id\\\\\\":\\\\\\"\\$mikrotikId\\\\\\",\\\\\\"token\\\\\\":\\\\\\"\\$apiToken\\\\\\"}\\\"; /tool fetch url=\\$apiUrl http-method=post http-header-field=\\"Content-Type:application/json\\" http-data=\\$jsonData dst-path=\\"vendas.txt\\"; :delay 2s; :local vendas [/file get [find name=\\"vendas.txt\\"] contents]; /file remove [find name=\\"vendas.txt\\"]; :if ([:len \\$vendas] > 0) do={ :local pos [:find \\$vendas \\"-\\"]; :if (\\$pos >= 0) do={ :local mac [:pick \\$vendas 0 \\$pos]; :local minutos [:tonum [:pick \\$vendas (\\$pos + 1) [:len \\$vendas]]]; :log info \\"MAC: \\$mac, Min: \\$minutos\\"; :if ([:find \\$macs \\$mac] < 0) do={ :do { /ip hotspot ip-binding remove [find mac-address=\\$mac] } on-error={}; :local agora [/system clock get time]; :local h [:tonum [:pick \\$agora 0 2]]; :local m [:tonum [:pick \\$agora 3 5]]; :local novoMin ((\\$h * 60) + \\$m + \\$minutos); :local novaH (\\$novoMin / 60); :local novaM (\\$novoMin % 60); :if (\\$novaH >= 24) do={ :set novaH (\\$novaH - 24) }; :local hs [:tostr \\$novaH]; :local ms [:tostr \\$novaM]; :if ([:len \\$hs] = 1) do={ :set hs (\\"0\\" . \\$hs) }; :if ([:len \\$ms] = 1) do={ :set ms (\\"0\\" . \\$ms) }; :local dataExpire ([/system clock get date] . \\"-\\" . \\$hs . \\$ms); :local comentario (\\"PIX-EXPIRE-\\" . \\$dataExpire . \\"-\\" . \\$mac); /ip hotspot ip-binding add mac-address=\\$mac type=bypassed comment=\\$comentario; :log info \\"Binding criado: \\$mac\\"; :set macs (\\$macs . \\$mac . \\";\\") } } } }; :if ([:len \\$macs] > 0) do={ :global pixMacsNotificar \\$macs; :global pixAcaoNotificar \\"connect\\"; :log info \\"Executando notificador...\\"; /system script run notificador-pix } else={ :log info \\"Nenhum MAC processado\\" }; :log info \\"PIX concluido\\""`,
      ``,
      `# 2. Script Limpeza (2min)`,
      `/system script add name="pix-limpeza" source=":log info \\"=== LIMPEZA AUTOMATICA INICIADA ===\\"; :local agora [/system clock get time]; :local hoje [/system clock get date]; :local h [:tonum [:pick \\$agora 0 [:find \\$agora \\":\\"]]]; :local m [:tonum [:pick \\$agora 3 5]]; :local minAtual ((\\$h * 60) + \\$m); :local pos1 [:find \\$hoje \\"-\\"]; :local anoAtual [:tonum [:pick \\$hoje 0 \\$pos1]]; :local resto1 [:pick \\$hoje (\\$pos1 + 1) [:len \\$hoje]]; :local pos2 [:find \\$resto1 \\"-\\"]; :local mesAtual [:tonum [:pick \\$resto1 0 \\$pos2]]; :local diaAtual [:tonum [:pick \\$resto1 (\\$pos2 + 1) [:len \\$resto1]]]; :log info \\"HOJE: \\$anoAtual-\\$mesAtual-\\$diaAtual \\$h:\\$m\\"; :local macsExpirados \\"\\"; :local removidos 0; :local total 0; :foreach binding in=[/ip hotspot ip-binding find where comment~\\"PIX-EXPIRE-\\"] do={ :set total (\\$total + 1); :local comentario [/ip hotspot ip-binding get \\$binding comment]; :local macAddress [/ip hotspot ip-binding get \\$binding mac-address]; :local pos [:find \\$comentario \\"PIX-EXPIRE-\\"]; :local dados [:pick \\$comentario (\\$pos + 11) [:len \\$comentario]]; :local p1 [:find \\$dados \\"-\\"]; :local ano [:tonum [:pick \\$dados 0 \\$p1]]; :local resto1 [:pick \\$dados (\\$p1 + 1) [:len \\$dados]]; :local p2 [:find \\$resto1 \\"-\\"]; :local mes [:tonum [:pick \\$resto1 0 \\$p2]]; :local resto2 [:pick \\$resto1 (\\$p2 + 1) [:len \\$resto1]]; :local p3 [:find \\$resto2 \\"-\\"]; :local dia [:tonum [:pick \\$resto2 0 \\$p3]]; :local resto3 [:pick \\$resto2 (\\$p3 + 1) [:len \\$resto2]]; :local p4 [:find \\$resto3 \\"-\\"]; :local horaStr [:pick \\$resto3 0 \\$p4]; :local horas [:tonum [:pick \\$horaStr 0 2]]; :local mins [:tonum [:pick \\$horaStr 2 4]]; :local minExpire ((\\$horas * 60) + \\$mins); :log info \\"EXPIRE: \\$ano-\\$mes-\\$dia \\$horas:\\$mins\\"; :local expirou false; :local dataAtualNum ((\\$anoAtual * 10000) + (\\$mesAtual * 100) + \\$diaAtual); :local dataExpireNum ((\\$ano * 10000) + (\\$mes * 100) + \\$dia); :log info \\"DataNum: atual=\\$dataAtualNum vs expire=\\$dataExpireNum\\"; :if (\\$dataExpireNum < \\$dataAtualNum) do={ :set expirou true; :log info \\"EXPIROU: Data passada (\\$dataExpireNum < \\$dataAtualNum)\\" }; :if (\\$dataExpireNum = \\$dataAtualNum and \\$minExpire <= \\$minAtual) do={ :set expirou true; :log info \\"EXPIROU: Mesmo dia, hora passada (\\$minExpire <= \\$minAtual)\\" }; :if (\\$expirou) do={ :log info \\"REMOVENDO: \\$macAddress\\"; /ip hotspot ip-binding remove \\$binding; :set macsExpirados (\\$macsExpirados . \\$macAddress . \\";\\"); :set removidos (\\$removidos + 1) } else={ :log info \\"MANTENDO: \\$macAddress\\" } }; :if ([:len \\$macsExpirados] > 0) do={ :global pixMacsDesconectar \\$macsExpirados; /system script run notificador-desconectado }; :log info \\"=== TOTAL:\\$total REMOVIDOS:\\$removidos ===\\""`,
      ``,
      `# 3. Script Heartbeat (5min) - CORRIGIDO`,
      `/system script add name="pix-heartbeat" source=":local url \\"https://api.lucro.top/api/mikrotik/heartbeat\\"; :local id \\"${mikrotik.id}\\"; :local token \\"${mikrotik.api_token}\\"; :local version [/system resource get version]; :local uptime [/system resource get uptime]; :local json \\"{\\\\\\"mikrotik_id\\\\\\":\\\\\\"\\$id\\\\\\",\\\\\\"token\\\\\\":\\\\\\"\\$token\\\\\\",\\\\\\"version\\\\\\":\\\\\\"\\$version\\\\\\",\\\\\\"uptime\\\\\\":\\\\\\"\\$uptime\\\\\\"}\\\"; :do { [/tool fetch url=\\$url http-method=post http-header-field=\\"Content-Type:application/json\\" http-data=\\$json] } on-error={}"`,
      ``,
      `# 4. Script Notificador PIX - COM RETRY E LIMPEZA CONDICIONAL`,
      `/system script add name="notificador-pix" source=":global pixMacsNotificar; :global pixAcaoNotificar; :log info \\"Notificador iniciado\\"; :log info \\"MACs: \\$pixMacsNotificar\\"; :log info \\"Acao: \\$pixAcaoNotificar\\"; :local url \\"https://api.lucro.top/api/mikrotik/auth-notification\\"; :local pos 0; :local sucessos 0; :local total 0; :while ([:find \\$pixMacsNotificar \\";\\\" \\$pos] >= 0) do={ :local fim [:find \\$pixMacsNotificar \\";\\\" \\$pos]; :local mac [:pick \\$pixMacsNotificar \\$pos \\$fim]; :if ([:len \\$mac] > 0) do={ :set total (\\$total + 1); :log info \\"Processando: \\$mac\\"; :local data \\"{\\\\\\"token\\\\\\":\\\\\\"${mikrotik.api_token}\\\\\\",\\\\\\"mac_address\\\\\\":\\\\\\"\\$mac\\\\\\",\\\\\\"mikrotik_id\\\\\\":\\\\\\"${mikrotik.id}\\\\\\",\\\\\\"action\\\\\\":\\\\\\"\\$pixAcaoNotificar\\\\\\"}\\\"; :local tentativa 1; :local enviado false; :while (\\$tentativa <= 3 and !\\$enviado) do={ :log info \\"Tentativa \\$tentativa: \\$mac\\"; :do { /tool fetch url=\\$url http-method=post http-header-field=\\"Content-Type: application/json\\" http-data=\\$data keep-result=no; :set enviado true; :set sucessos (\\$sucessos + 1); :log info \\"Sucesso: \\$mac\\" } on-error={ :log error \\"Erro tentativa \\$tentativa: \\$mac\\"; :set tentativa (\\$tentativa + 1); :if (\\$tentativa <= 3) do={ :delay 1s } } }; :if (!\\$enviado) do={ :log error \\"Falha total: \\$mac\\" } }; :set pos (\\$fim + 1) }; :if (\\$sucessos = \\$total and \\$total > 0) do={ :set pixMacsNotificar; :set pixAcaoNotificar; :log info \\"Todas enviadas - variaveis limpas (\\$sucessos/\\$total)\\" } else={ :log warning \\"Falhas detectadas - variaveis mantidas (\\$sucessos/\\$total)\\" }; :log info \\"Finalizado\\""`,
      ``,
      `# 5. Script Notificador Desconectado - COM RETRY E LIMPEZA CONDICIONAL`,
      `/system script add name="notificador-desconectado" source=":global pixMacsDesconectar; :log info \\"Notificador desconectado iniciado\\"; :log info \\"MACs: \\$pixMacsDesconectar\\"; :local url \\"https://api.lucro.top/api/mikrotik/auth-notification\\"; :local pos 0; :local sucessos 0; :local total 0; :while ([:find \\$pixMacsDesconectar \\";\\\" \\$pos] >= 0) do={ :local fim [:find \\$pixMacsDesconectar \\";\\\" \\$pos]; :local mac [:pick \\$pixMacsDesconectar \\$pos \\$fim]; :if ([:len \\$mac] > 0) do={ :set total (\\$total + 1); :log info \\"Processando desconexao: \\$mac\\"; :local data \\"{\\\\\\"token\\\\\\":\\\\\\"${mikrotik.api_token}\\\\\\",\\\\\\"mac_address\\\\\\":\\\\\\"\\$mac\\\\\\",\\\\\\"mikrotik_id\\\\\\":\\\\\\"${mikrotik.id}\\\\\\",\\\\\\"action\\\\\\":\\\\\\"disconnect\\\\\\"}\\\"; :local tentativa 1; :local enviado false; :while (\\$tentativa <= 3 and !\\$enviado) do={ :log info \\"Tentativa \\$tentativa desconexao: \\$mac\\"; :do { /tool fetch url=\\$url http-method=post http-header-field=\\"Content-Type: application/json\\" http-data=\\$data keep-result=no; :set enviado true; :set sucessos (\\$sucessos + 1); :log info \\"Sucesso desconexao: \\$mac\\" } on-error={ :log error \\"Erro tentativa \\$tentativa desconexao: \\$mac\\"; :set tentativa (\\$tentativa + 1); :if (\\$tentativa <= 3) do={ :delay 1s } } }; :if (!\\$enviado) do={ :log error \\"Falha total desconexao: \\$mac\\" } }; :set pos (\\$fim + 1) }; :if (\\$sucessos = \\$total and \\$total > 0) do={ :set pixMacsDesconectar; :log info \\"Todas desconexoes enviadas - variavel limpa (\\$sucessos/\\$total)\\" } else={ :log warning \\"Falhas detectadas - variavel mantida (\\$sucessos/\\$total)\\" }; :log info \\"Notificador desconectado finalizado\\""`,
      ``,
      `# 6. Schedulers`,
      `/system scheduler add name="pix-verificador-scheduler" start-time=startup interval=40s on-event="/system script run pix-verificador"`,
      `/system scheduler add name="pix-limpeza-scheduler" start-time=startup interval=2m on-event="/system script run pix-limpeza"`,
      `/system scheduler add name="pix-heartbeat-scheduler" start-time=startup interval=5m on-event="/system script run pix-heartbeat"`,
      ``,
      `# 7. Testes`,
      `/system script run pix-heartbeat`,
      `/system script run pix-verificador`,
      ``,
      `# 8. Verificação`,
      `/system script print`,
      `/system scheduler print`,
      `/log print where topics~"script"`
    ].join('\n');

    try {
      await navigator.clipboard.writeText(allCommands);
      toast({
        title: "✅ Todos os Códigos Copiados!",
        description: "Instalação completa copiada para a área de transferência",
      });
    } catch (err) {
      toast({
        title: "❌ Erro",
        description: "Não foi possível copiar todos os comandos",
        variant: "destructive",
      });
    }
  };

  const fetchPlans = async () => {
    if (!selectedMikrotik) return;
    
    try {
      const { data: planosData, error } = await supabase
        .from('planos')
        .select('*')
        .eq('mikrotik_id', selectedMikrotik.id)
        .order('criado_em', { ascending: false });
      
      if (error) throw error;
      setPlans(planosData || []);
      
    } catch (err: any) {
      console.error('Erro ao carregar planos:', err);
      setError('Erro ao carregar planos');
    } finally {
      setTimeout(() => setLoading(false), 100);
    }
  };

  useEffect(() => {
    if (showPlansModal && selectedMikrotik) {
      fetchPlans();
    }
  }, [showPlansModal, selectedMikrotik]);

  const handleCreateMikrotik = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      
      const { data, error } = await supabase
        .from('mikrotiks')
        .insert([{
          nome: formData.nome,
          provider_name: formData.provider_name || null,
          profitpercentage: formData.profitpercentage,
          status: formData.status,
          cliente_id: formData.cliente_id || null
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      setSuccess('MikroTik criado com sucesso!');
      setShowAddModal(false);
      resetForm();
      fetchData();
      
    } catch (err: any) {
      console.error('Erro ao criar MikroTik:', err);
      setError(err.message || 'Erro ao criar MikroTik');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMikrotik = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMikrotik) return;
    
    try {
      setLoading(true);
      setError('');
      
      const { error } = await supabase
        .from('mikrotiks')
        .update({
          nome: formData.nome,
          provider_name: formData.provider_name || null,
          profitpercentage: formData.profitpercentage,
          status: formData.status,
          cliente_id: formData.cliente_id || null
        })
        .eq('id', editingMikrotik.id);
      
      if (error) throw error;
      
      setSuccess('MikroTik atualizado com sucesso!');
      setShowAddModal(false);
      setEditingMikrotik(null);
      resetForm();
      fetchData();
      
    } catch (err: any) {
      console.error('Erro ao atualizar MikroTik:', err);
      setError(err.message || 'Erro ao atualizar MikroTik');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMikrotik = async (mikrotik: Mikrotik) => {
    if (!confirm(`Tem certeza que deseja excluir ${mikrotik.nome}? Esta ação não pode ser desfeita.`)) {
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const { data: planosData, error: planosError } = await supabase
        .from('planos')
        .select('id')
        .eq('mikrotik_id', mikrotik.id);
      
      if (planosError) throw planosError;
      
      if (planosData && planosData.length > 0) {
        setError('Não é possível excluir este MikroTik pois existem planos vinculados a ele. Exclua os planos primeiro.');
        return;
      }
      
      const { data: vendasData, error: vendasError } = await supabase
        .from('vendas')
        .select('id')
        .eq('mikrotik_id', mikrotik.id);
      
      if (vendasError) throw vendasError;
      
      if (vendasData && vendasData.length > 0) {
        setError('Não é possível excluir este MikroTik pois existem vendas vinculadas a ele.');
        return;
      }
      
      const { error } = await supabase
        .from('mikrotiks')
        .delete()
        .eq('id', mikrotik.id);
      
      if (error) throw error;
      
      setSuccess('MikroTik excluído com sucesso!');
      fetchData();
      
    } catch (err: any) {
      console.error('Erro ao excluir MikroTik:', err);
      setError(err.message || 'Erro ao excluir MikroTik');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMikrotik) return;
    
    try {
      setLoading(true);
      setError('');
      
      const { error } = await supabase
        .from('planos')
        .insert([{
          nome: planFormData.nome,
          preco: parseFloat(planFormData.preco),
          duracao: planFormData.duracao,
          mikrotik_id: selectedMikrotik.id
        }]);
      
      if (error) throw error;
      
      setSuccess('Plano criado com sucesso!');
      setShowAddPlanModal(false);
      setPlanFormData({ nome: '', preco: '', duracao: 60 });
      fetchPlans();
      
    } catch (err: any) {
      console.error('Erro ao criar plano:', err);
      setError(err.message || 'Erro ao criar plano');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;
    
    try {
      setLoading(true);
      setError('');
      
      const { error } = await supabase
        .from('planos')
        .update({
          nome: planFormData.nome,
          preco: parseFloat(planFormData.preco),
          duracao: planFormData.duracao
        })
        .eq('id', editingPlan.id);
      
      if (error) throw error;
      
      setSuccess('Plano atualizado com sucesso!');
      setShowAddPlanModal(false);
      setEditingPlan(null);
      setPlanFormData({ nome: '', preco: '', duracao: 60 });
      fetchPlans();
      
    } catch (err: any) {
      console.error('Erro ao atualizar plano:', err);
      setError(err.message || 'Erro ao atualizar plano');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlan = async (plan: Plan) => {
    if (!confirm(`Tem certeza que deseja excluir o plano ${plan.nome}?`)) {
      return;
    }
    
    try {
      setError('');
      const { error } = await supabase
        .from('planos')
        .delete()
        .eq('id', plan.id);
      
      if (error) throw error;
      
      setSuccess('Plano excluído com sucesso!');
      fetchPlans();
      
    } catch (err: any) {
      console.error('Erro ao excluir plano:', err);
      setError(err.message || 'Erro ao excluir plano');
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      provider_name: '',
      profitpercentage: 10,
      status: 'Ativo',
      cliente_id: ''
    });
  };

  const getStatusBadge = (status: string) => {
    return status === 'Ativo' ? (
      <Badge className="bg-green-100 text-green-800">Ativo</Badge>
    ) : (
      <Badge variant="secondary">Inativo</Badge>
    );
  };

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const handleLinkClient = async (mikrotikId: string, clienteId: string) => {
    try {
      setError('');
      const { error } = await supabase
        .from('mikrotiks')
        .update({ cliente_id: clienteId })
        .eq('id', mikrotikId);
      
      if (error) throw error;
      
      setSuccess('Cliente vinculado com sucesso!');
      setShowLinkClientModal(false);
      setLinkingMikrotik(null);
      fetchData();
      
    } catch (err: any) {
      console.error('Erro ao vincular cliente:', err);
      setError(err.message || 'Erro ao vincular cliente');
    }
  };

  const handleUnlinkClient = async (mikrotikId: string) => {
    try {
      setError('');
      const { error } = await supabase
        .from('mikrotiks')
        .update({ cliente_id: null })
        .eq('id', mikrotikId);
      
      if (error) throw error;
      
      setSuccess('Cliente desvinculado com sucesso!');
      fetchData();
      
    } catch (err: any) {
      console.error('Erro ao desvincular cliente:', err);
      setError(err.message || 'Erro ao desvincular cliente');
    }
  };

  const getClientName = (clienteId: string) => {
    const cliente = clientes.find(c => c.id === clienteId);
    return cliente ? cliente.nome : 'Cliente não encontrado';
  };

  // Função para obter estatísticas de versões
  const getVersionStats = () => {
    const versions = mikrotiksStatus
      .filter(m => m.heartbeat_version)
      .map(m => m.heartbeat_version)
      .filter(Boolean);
    
    const versionCounts = versions.reduce((acc, version) => {
      acc[version!] = (acc[version!] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(versionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3); // Top 3 versões mais usadas
  };

  const filteredMikrotiks = mikrotiks.filter((mikrotik) => {
    const matchesSearch = mikrotik.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (mikrotik.provider_name && mikrotik.provider_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = filterStatus === 'all' || mikrotik.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-lg">Carregando...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">MikroTiks</h2>
          <p className="text-muted-foreground">
            Gerencie seus equipamentos MikroTik e configurações
          </p>
        </div>
        <Button 
          onClick={() => {
            setShowAddModal(true);
            resetForm();
            clearMessages();
          }}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar MikroTik
        </Button>
      </div>

      {/* Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="border-green-500 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total MikroTiks</CardTitle>
            <Router className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mikrotiks.length}</div>
            <p className="text-xs text-muted-foreground">
              Equipamentos cadastrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online Agora</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {mikrotiksStatus.filter(m => m.is_online).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Conectados no momento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Com Heartbeat</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {mikrotiksStatus.filter(m => m.heartbeat_version).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Enviando dados de sistema
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Versões RouterOS mais comuns */}
      {mikrotiksStatus.filter(m => m.heartbeat_version).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              Versões RouterOS em Uso
            </CardTitle>
            <CardDescription>
              Distribuição das versões de RouterOS nos equipamentos conectados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {getVersionStats().map(([version, count], index) => (
                <div key={version} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      index === 0 ? 'bg-blue-500' : 
                      index === 1 ? 'bg-green-500' : 
                      'bg-purple-500'
                    }`} />
                    <span className="font-mono text-sm">{version}</span>
                  </div>
                  <Badge variant="secondary">
                    {count} equipamento{count > 1 ? 's' : ''}
                  </Badge>
                </div>
              ))}
              {getVersionStats().length === 0 && (
                <div className="col-span-full text-center text-gray-500 py-4">
                  Nenhuma versão de RouterOS detectada
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="Ativo">Ativos</SelectItem>
                <SelectItem value="Inativo">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* MikroTiks Table */}
      <Card>
        <CardHeader>
          <CardTitle>Equipamentos MikroTik</CardTitle>
          <CardDescription>
            Lista completa de equipamentos cadastrados no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>MikroTik</TableHead>
                {currentUser?.role === 'admin' && <TableHead>Proprietário</TableHead>}
                <TableHead>Conexão</TableHead>
                <TableHead>Versão</TableHead>
                <TableHead>Uptime</TableHead>
                <TableHead>Porcentagem</TableHead>
                <TableHead>Status</TableHead>
                {currentUser?.role === 'admin' && <TableHead>Token API</TableHead>}
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMikrotiks.map((mikrotik) => (
                <TableRow key={mikrotik.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Router className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{mikrotik.nome}</div>
                        <div className="text-sm text-gray-500">
                          {mikrotik.provider_name || 'Sem provedor'}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  
                  {currentUser?.role === 'admin' && (
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-600">
                            {mikrotik.cliente_id 
                              ? clientes.find(c => c.id === mikrotik.cliente_id)?.nome || 'Cliente não encontrado'
                              : 'Não vinculado'}
                          </span>
                          {mikrotik.cliente_id && (
                            <span className="text-xs text-gray-400">
                              {clientes.find(c => c.id === mikrotik.cliente_id)?.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                  )}
                  
                  <TableCell>
                    {(() => {
                      const statusData = mikrotiksStatus.find(s => s.id === mikrotik.id);
                      if (!statusData) {
                        return <span className="text-xs text-gray-400">Carregando...</span>;
                      }
                      return (
                        <MikrotikStatusBadge
                          isOnline={statusData.is_online}
                          minutosOffline={statusData.minutos_offline}
                          ultimoHeartbeat={statusData.ultimo_heartbeat}
                          version={statusData.heartbeat_version}
                          uptime={statusData.heartbeat_uptime}
                          size="sm"
                        />
                      );
                    })()}
                  </TableCell>
                  
                  <TableCell>
                    {(() => {
                      const statusData = mikrotiksStatus.find(s => s.id === mikrotik.id);
                      if (!statusData) {
                        return <span className="text-xs text-gray-400">-</span>;
                      }
                      return statusData.heartbeat_version ? (
                        <div className="flex items-center gap-1">
                          <Activity className="w-3 h-3 text-blue-500" />
                          <span className="text-xs font-mono text-gray-700">
                            {statusData.heartbeat_version}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">N/A</span>
                      );
                    })()}
                  </TableCell>
                  
                  <TableCell>
                    {(() => {
                      const statusData = mikrotiksStatus.find(s => s.id === mikrotik.id);
                      if (!statusData) {
                        return <span className="text-xs text-gray-400">-</span>;
                      }
                      return statusData.heartbeat_uptime ? (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-green-500" />
                          <span className="text-xs font-mono text-gray-700">
                            {statusData.heartbeat_uptime}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">N/A</span>
                      );
                    })()}
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-emerald-600" />
                      <span className="font-semibold text-emerald-600">
                        {mikrotik.profitpercentage}%
                      </span>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    {getStatusBadge(mikrotik.status)}
                  </TableCell>

                  {currentUser?.role === 'admin' && (
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Key className="w-4 h-4 text-gray-400" />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedMikrotik(mikrotik);
                            setShowTokenModal(true);
                            setShowToken(false);
                          }}
                        >
                          Ver Token
                        </Button>
                      </div>
                    </TableCell>
                  )}
                  
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => {
                            setSelectedMikrotik(mikrotik);
                            setShowPlansModal(true);
                            clearMessages();
                          }}
                        >
                          <Settings className="w-4 h-4 mr-2" />
                          Gerenciar Planos
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem 
                          onClick={() => handleShowInstallationCode(mikrotik)}
                          className="text-blue-600"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Código de Instalação
                        </DropdownMenuItem>
                        
                        {currentUser?.role === 'admin' && (
                          <>
                            <DropdownMenuItem 
                              onClick={() => {
                                setSelectedMikrotik(mikrotik);
                                setShowTokenModal(true);
                                setShowToken(false);
                              }}
                            >
                              <Key className="w-4 h-4 mr-2" />
                              Gerenciar Token
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem 
                              onClick={() => {
                                setLinkingMikrotik(mikrotik);
                                setShowLinkClientModal(true);
                                clearMessages();
                              }}
                            >
                              <Users className="w-4 h-4 mr-2" />
                              {mikrotik.cliente_id ? 'Alterar Cliente' : 'Vincular Cliente'}
                            </DropdownMenuItem>
                            
                            {mikrotik.cliente_id && (
                              <DropdownMenuItem 
                                onClick={() => {
                                  if (confirm('Tem certeza que deseja desvincular este cliente?')) {
                                    handleUnlinkClient(mikrotik.id);
                                  }
                                }}
                                className="text-orange-600"
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Desvincular Cliente
                              </DropdownMenuItem>
                            )}
                          </>
                        )}
                        
                        <DropdownMenuItem 
                          onClick={() => {
                            setEditingMikrotik(mikrotik);
                            setFormData({
                              nome: mikrotik.nome,
                              provider_name: mikrotik.provider_name || '',
                              profitpercentage: mikrotik.profitpercentage,
                              status: mikrotik.status,
                              cliente_id: mikrotik.cliente_id || ''
                            });
                            clearMessages();
                            setShowAddModal(true);
                          }}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem 
                          onClick={() => handleDeleteMikrotik(mikrotik)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal para Gerenciar Token */}
      <Dialog open={showTokenModal} onOpenChange={setShowTokenModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              Token API - {selectedMikrotik?.nome}
            </DialogTitle>
            <DialogDescription>
              Gerencie o token de API individual deste MikroTik
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="token">Token Atual</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="token"
                  type={showToken ? 'text' : 'password'}
                  value={selectedMikrotik?.api_token || ''}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowToken(!showToken)}
                >
                  {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => selectedMikrotik?.api_token && handleCopyToken(selectedMikrotik.api_token)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Este token é único para este MikroTik e deve ser configurado no script de heartbeat.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowTokenModal(false)}
            >
              Fechar
            </Button>
            <Button
              onClick={() => selectedMikrotik && handleRegenerateToken(selectedMikrotik)}
              disabled={generatingToken}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {generatingToken ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Regenerar Token
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MikroTik Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingMikrotik ? 'Editar MikroTik' : 'Novo MikroTik'}
            </DialogTitle>
            <DialogDescription>
              {editingMikrotik ? 'Atualize as informações do equipamento' : 'Configure um novo equipamento MikroTik'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={editingMikrotik ? handleUpdateMikrotik : handleCreateMikrotik} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome do MikroTik</Label>
                <Input
                  id="nome"
                  required
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: MikroTik Central"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="provider_name">Nome do Provedor</Label>
                <Input
                  id="provider_name"
                  value={formData.provider_name}
                  onChange={(e) => setFormData({ ...formData, provider_name: e.target.value })}
                  placeholder="Ex: Internet Central"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="profitpercentage">Porcentagem de Lucro (%)</Label>
                <Input
                  id="profitpercentage"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.profitpercentage}
                  onChange={(e) => setFormData({ ...formData, profitpercentage: parseFloat(e.target.value) })}
                  placeholder="Ex: 10"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ativo">Ativo</SelectItem>
                    <SelectItem value="Inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {currentUser?.role === 'admin' && (
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="cliente_id">Vincular a Cliente (opcional)</Label>
                  <Select value={formData.cliente_id || 'null'} onValueChange={(value) => setFormData({ ...formData, cliente_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cliente ou deixe em branco para sistema" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="null">Sistema (sem vinculação)</SelectItem>
                      {clientes.filter(c => c.role === 'user').map((cliente) => (
                        <SelectItem key={cliente.id} value={cliente.id}>
                          {cliente.nome} ({cliente.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            
            <DialogFooter className="gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowAddModal(false);
                  setEditingMikrotik(null);
                  resetForm();
                }}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? 'Processando...' : (editingMikrotik ? 'Atualizar' : 'Criar')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Plans Modal */}
      <Dialog open={showPlansModal} onOpenChange={setShowPlansModal}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              Gerenciar Planos - {selectedMikrotik?.nome}
            </DialogTitle>
            <DialogDescription>
              Configure os planos de internet disponíveis para este equipamento
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-lg font-medium">Planos Cadastrados</h4>
              <Button 
                onClick={() => {
                  setShowAddPlanModal(true);
                  clearMessages();
                }}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Novo Plano
              </Button>
            </div>
            
            <div className="space-y-3">
              {plans.map((plan) => (
                <div key={plan.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h5 className="font-medium">{plan.nome}</h5>
                    <p className="text-sm text-gray-600">
                      R$ {plan.preco.toFixed(2)} - {plan.duracao} minuto{plan.duracao !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingPlan(plan);
                        setPlanFormData({
                          nome: plan.nome,
                          preco: plan.preco.toString(),
                          duracao: plan.duracao
                        });
                        clearMessages();
                        setShowAddPlanModal(true);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeletePlan(plan)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              {plans.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Settings className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Nenhum plano cadastrado</p>
                  <p className="text-sm">Clique em "Novo Plano" para começar</p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Plan Modal */}
      <Dialog open={showAddPlanModal} onOpenChange={setShowAddPlanModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPlan ? 'Editar Plano' : 'Novo Plano'}
            </DialogTitle>
            <DialogDescription>
              {editingPlan ? 'Atualize as informações do plano' : 'Cadastre um novo plano de internet'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={editingPlan ? handleUpdatePlan : handleCreatePlan} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="planNome">Nome do Plano</Label>
              <Input
                id="planNome"
                required
                value={planFormData.nome}
                onChange={(e) => setPlanFormData({ ...planFormData, nome: e.target.value })}
                placeholder="Ex: 1 Hora Premium"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="planPreco">Preço (R$)</Label>
                <Input
                  id="planPreco"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={planFormData.preco}
                  onChange={(e) => setPlanFormData({ ...planFormData, preco: e.target.value })}
                  placeholder="Ex: 5.00"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="planDuracao">Duração (minutos)</Label>
                <Input
                  id="planDuracao"
                  type="number"
                  min="1"
                  required
                  value={planFormData.duracao}
                  onChange={(e) => setPlanFormData({ ...planFormData, duracao: parseInt(e.target.value) })}
                  placeholder="Ex: 60"
                />
              </div>
            </div>
            
            <DialogFooter className="gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowAddPlanModal(false);
                  setEditingPlan(null);
                  setPlanFormData({ nome: '', preco: '', duracao: 60 });
                }}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? 'Processando...' : (editingPlan ? 'Atualizar' : 'Criar')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Link Client Modal */}
      <Dialog open={showLinkClientModal} onOpenChange={setShowLinkClientModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Vincular Cliente - {linkingMikrotik?.nome}
            </DialogTitle>
            <DialogDescription>
              Selecione um cliente para vincular ao MikroTik ou deixe em branco para sistema
            </DialogDescription>
          </DialogHeader>
          
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const clienteId = formData.get('cliente_id') as string;
              if (linkingMikrotik) {
                handleLinkClient(linkingMikrotik.id, clienteId);
              }
            }} 
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="cliente_id">Cliente</Label>
              <Select name="cliente_id" defaultValue={linkingMikrotik?.cliente_id || 'null'}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cliente ou deixe em branco para sistema" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="null">Sistema (sem vinculação)</SelectItem>
                  {clientes.filter(c => c.role === 'user').map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.id}>
                      {cliente.nome} ({cliente.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500">
                Clientes vinculados poderão gerenciar os planos deste MikroTik
              </p>
            </div>
            
            <DialogFooter className="gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowLinkClientModal(false);
                  setLinkingMikrotik(null);
                }}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? 'Processando...' : 'Salvar Vinculação'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Installation Code Modal */}
      <Dialog open={showInstallModal} onOpenChange={setShowInstallModal}>
        <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              Código de Instalação - {selectedInstallMikrotik?.nome}
            </DialogTitle>
            <DialogDescription>
              Scripts para instalação completa do sistema PIX no MikroTik. Copie e cole cada comando separadamente.
            </DialogDescription>
          </DialogHeader>
          
          {/* Botão Copiar Todos os Códigos */}
          {selectedInstallMikrotik && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-blue-900 mb-1">📋 Instalação Completa</h4>
                  <p className="text-sm text-blue-700">Copie todos os comandos de uma vez e cole no bloco de notas para facilitar a instalação</p>
                </div>
                <Button
                  onClick={() => handleCopyAllCommands(selectedInstallMikrotik)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar Todos os Códigos
                </Button>
              </div>
            </div>
          )}
          
          {selectedInstallMikrotik && (
            <div className="space-y-6">
              {/* Informações do MikroTik */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Informações do MikroTik</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div><strong>Nome:</strong> {selectedInstallMikrotik.nome}</div>
                  <div><strong>ID:</strong> {selectedInstallMikrotik.id}</div>
                  <div><strong>Token:</strong> {selectedInstallMikrotik.api_token}</div>
                  <div><strong>API:</strong> https://api.lucro.top</div>
                </div>
              </div>

              {/* Passo 1: Script Verificador */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-lg">1. Script Verificador de Pagamentos (40s)</h4>
                  <Button
                    size="sm"
                    onClick={() => handleCopyCommand(
                      `/system script add name="pix-verificador" source=":local apiUrl \\"https://api.lucro.top/api/recent-sales\\"; :local mikrotikId \\"${selectedInstallMikrotik.id}\\"; :local apiToken \\"${selectedInstallMikrotik.api_token}\\"; :log info \\"PIX iniciado\\"; :local macs \\"\\"; :for tentativa from=1 to=5 do={ :log info \\"Tentativa \\$tentativa\\"; :local jsonData \\"{\\\\\\"mikrotik_id\\\\\\":\\\\\\"\\$mikrotikId\\\\\\",\\\\\\"token\\\\\\":\\\\\\"\\$apiToken\\\\\\"}\\\"; /tool fetch url=\\$apiUrl http-method=post http-header-field=\\"Content-Type:application/json\\" http-data=\\$jsonData dst-path=\\"vendas.txt\\"; :delay 2s; :local vendas [/file get [find name=\\"vendas.txt\\"] contents]; /file remove [find name=\\"vendas.txt\\"]; :if ([:len \\$vendas] > 0) do={ :local pos [:find \\$vendas \\"-\\"]; :if (\\$pos >= 0) do={ :local mac [:pick \\$vendas 0 \\$pos]; :local minutos [:tonum [:pick \\$vendas (\\$pos + 1) [:len \\$vendas]]]; :log info \\"MAC: \\$mac, Min: \\$minutos\\"; :if ([:find \\$macs \\$mac] < 0) do={ :do { /ip hotspot ip-binding remove [find mac-address=\\$mac] } on-error={}; :local agora [/system clock get time]; :local h [:tonum [:pick \\$agora 0 2]]; :local m [:tonum [:pick \\$agora 3 5]]; :local novoMin ((\\$h * 60) + \\$m + \\$minutos); :local novaH (\\$novoMin / 60); :local novaM (\\$novoMin % 60); :if (\\$novaH >= 24) do={ :set novaH (\\$novaH - 24) }; :local hs [:tostr \\$novaH]; :local ms [:tostr \\$novaM]; :if ([:len \\$hs] = 1) do={ :set hs (\\"0\\" . \\$hs) }; :if ([:len \\$ms] = 1) do={ :set ms (\\"0\\" . \\$ms) }; :local dataExpire ([/system clock get date] . \\"-\\" . \\$hs . \\$ms); :local comentario (\\"PIX-EXPIRE-\\" . \\$dataExpire . \\"-\\" . \\$mac); /ip hotspot ip-binding add mac-address=\\$mac type=bypassed comment=\\$comentario; :log info \\"Binding criado: \\$mac\\"; :set macs (\\$macs . \\$mac . \\";\\") } } } }; :if ([:len \\$macs] > 0) do={ :global pixMacsNotificar \\$macs; :global pixAcaoNotificar \\"connect\\"; :log info \\"Executando notificador...\\"; /system script run notificador-pix } else={ :log info \\"Nenhum MAC processado\\" }; :log info \\"PIX concluido\\""`,
                      "Script Verificador"
                    )}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar
                  </Button>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg font-mono text-sm overflow-x-auto">
                  /system script add name="pix-verificador" source=":local apiUrl \"https://api.lucro.top/api/recent-sales\"..."
                </div>
              </div>

              {/* Passo 2: Script Limpeza */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-lg">2. Script de Limpeza (2min)</h4>
                  <Button
                    size="sm"
                    onClick={() => handleCopyCommand(
                      `/system script add name="pix-limpeza" source=":log info \\"=== LIMPEZA AUTOMATICA INICIADA ===\\"; :local agora [/system clock get time]; :local hoje [/system clock get date]; :local h [:tonum [:pick \\$agora 0 [:find \\$agora \\":\\"]]]; :local m [:tonum [:pick \\$agora 3 5]]; :local minAtual ((\\$h * 60) + \\$m); :local pos1 [:find \\$hoje \\"-\\"]; :local anoAtual [:tonum [:pick \\$hoje 0 \\$pos1]]; :local resto1 [:pick \\$hoje (\\$pos1 + 1) [:len \\$hoje]]; :local pos2 [:find \\$resto1 \\"-\\"]; :local mesAtual [:tonum [:pick \\$resto1 0 \\$pos2]]; :local diaAtual [:tonum [:pick \\$resto1 (\\$pos2 + 1) [:len \\$resto1]]]; :log info \\"HOJE: \\$anoAtual-\\$mesAtual-\\$diaAtual \\$h:\\$m\\"; :local macsExpirados \\"\\"; :local removidos 0; :local total 0; :foreach binding in=[/ip hotspot ip-binding find where comment~\\"PIX-EXPIRE-\\"] do={ :set total (\\$total + 1); :local comentario [/ip hotspot ip-binding get \\$binding comment]; :local macAddress [/ip hotspot ip-binding get \\$binding mac-address]; :local pos [:find \\$comentario \\"PIX-EXPIRE-\\"]; :local dados [:pick \\$comentario (\\$pos + 11) [:len \\$comentario]]; :local p1 [:find \\$dados \\"-\\"]; :local ano [:tonum [:pick \\$dados 0 \\$p1]]; :local resto1 [:pick \\$dados (\\$p1 + 1) [:len \\$dados]]; :local p2 [:find \\$resto1 \\"-\\"]; :local mes [:tonum [:pick \\$resto1 0 \\$p2]]; :local resto2 [:pick \\$resto1 (\\$p2 + 1) [:len \\$resto1]]; :local p3 [:find \\$resto2 \\"-\\"]; :local dia [:tonum [:pick \\$resto2 0 \\$p3]]; :local resto3 [:pick \\$resto2 (\\$p3 + 1) [:len \\$resto2]]; :local p4 [:find \\$resto3 \\"-\\"]; :local horaStr [:pick \\$resto3 0 \\$p4]; :local horas [:tonum [:pick \\$horaStr 0 2]]; :local mins [:tonum [:pick \\$horaStr 2 4]]; :local minExpire ((\\$horas * 60) + \\$mins); :log info \\"EXPIRE: \\$ano-\\$mes-\\$dia \\$horas:\\$mins\\"; :local expirou false; :local dataAtualNum ((\\$anoAtual * 10000) + (\\$mesAtual * 100) + \\$diaAtual); :local dataExpireNum ((\\$ano * 10000) + (\\$mes * 100) + \\$dia); :log info \\"DataNum: atual=\\$dataAtualNum vs expire=\\$dataExpireNum\\"; :if (\\$dataExpireNum < \\$dataAtualNum) do={ :set expirou true; :log info \\"EXPIROU: Data passada (\\$dataExpireNum < \\$dataAtualNum)\\" }; :if (\\$dataExpireNum = \\$dataAtualNum and \\$minExpire <= \\$minAtual) do={ :set expirou true; :log info \\"EXPIROU: Mesmo dia, hora passada (\\$minExpire <= \\$minAtual)\\" }; :if (\\$expirou) do={ :log info \\"REMOVENDO: \\$macAddress\\"; /ip hotspot ip-binding remove \\$binding; :set macsExpirados (\\$macsExpirados . \\$macAddress . \\";\\"); :set removidos (\\$removidos + 1) } else={ :log info \\"MANTENDO: \\$macAddress\\" } }; :if ([:len \\$macsExpirados] > 0) do={ :global pixMacsDesconectar \\$macsExpirados; /system script run notificador-desconectado }; :log info \\"=== TOTAL:\\$total REMOVIDOS:\\$removidos ===\\""`,
                      "Script Limpeza"
                    )}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar
                  </Button>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg font-mono text-sm overflow-x-auto">
                  /system script add name="pix-limpeza" source=":log info \"=== LIMPEZA AUTOMATICA INICIADA ===\"..."
                </div>
              </div>

              {/* Passo 3: Script Heartbeat */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-lg">3. Script de Heartbeat (5min) - CORRIGIDO</h4>
                  <Button
                    size="sm"
                    onClick={() => handleCopyCommand(
                      `/system script add name="pix-heartbeat" source=":local url \\"https://api.lucro.top/api/mikrotik/heartbeat\\"; :local id \\"${selectedInstallMikrotik.id}\\"; :local token \\"${selectedInstallMikrotik.api_token}\\"; :local version [/system resource get version]; :local uptime [/system resource get uptime]; :local json \\"{\\\\\\"mikrotik_id\\\\\\":\\\\\\"\\$id\\\\\\",\\\\\\"token\\\\\\":\\\\\\"\\$token\\\\\\",\\\\\\"version\\\\\\":\\\\\\"\\$version\\\\\\",\\\\\\"uptime\\\\\\":\\\\\\"\\$uptime\\\\\\"}\\\"; :do { [/tool fetch url=\\$url http-method=post http-header-field=\\"Content-Type:application/json\\" http-data=\\$json] } on-error={}"`,
                      "Script Heartbeat"
                    )}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar
                  </Button>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg font-mono text-sm overflow-x-auto">
                  /system script add name="pix-heartbeat" source=":local url \"https://api.lucro.top/api/mikrotik/heartbeat\"..."
                </div>
              </div>

              {/* Passo 4: Script Notificador PIX */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-lg">4. Script Notificador PIX - COM RETRY E LIMPEZA CONDICIONAL</h4>
                  <Button
                    size="sm"
                    onClick={() => handleCopyCommand(
                      `/system script add name="notificador-pix" source=":global pixMacsNotificar; :global pixAcaoNotificar; :log info \\"Notificador iniciado\\"; :log info \\"MACs: \\$pixMacsNotificar\\"; :log info \\"Acao: \\$pixAcaoNotificar\\"; :local url \\"https://api.lucro.top/api/mikrotik/auth-notification\\"; :local pos 0; :local sucessos 0; :local total 0; :while ([:find \\$pixMacsNotificar \\";\\\" \\$pos] >= 0) do={ :local fim [:find \\$pixMacsNotificar \\";\\\" \\$pos]; :local mac [:pick \\$pixMacsNotificar \\$pos \\$fim]; :if ([:len \\$mac] > 0) do={ :set total (\\$total + 1); :log info \\"Processando: \\$mac\\"; :local data \\"{\\\\\\"token\\\\\\":\\\\\\"${selectedInstallMikrotik.api_token}\\\\\\",\\\\\\"mac_address\\\\\\":\\\\\\"\\$mac\\\\\\",\\\\\\"mikrotik_id\\\\\\":\\\\\\"${selectedInstallMikrotik.id}\\\\\\",\\\\\\"action\\\\\\":\\\\\\"\\$pixAcaoNotificar\\\\\\"}\\\"; :local tentativa 1; :local enviado false; :while (\\$tentativa <= 3 and !\\$enviado) do={ :log info \\"Tentativa \\$tentativa: \\$mac\\"; :do { /tool fetch url=\\$url http-method=post http-header-field=\\"Content-Type: application/json\\" http-data=\\$data keep-result=no; :set enviado true; :set sucessos (\\$sucessos + 1); :log info \\"Sucesso: \\$mac\\" } on-error={ :log error \\"Erro tentativa \\$tentativa: \\$mac\\"; :set tentativa (\\$tentativa + 1); :if (\\$tentativa <= 3) do={ :delay 1s } } }; :if (!\\$enviado) do={ :log error \\"Falha total: \\$mac\\" } }; :set pos (\\$fim + 1) }; :if (\\$sucessos = \\$total and \\$total > 0) do={ :set pixMacsNotificar; :set pixAcaoNotificar; :log info \\"Todas enviadas - variaveis limpas (\\$sucessos/\\$total)\\" } else={ :log warning \\"Falhas detectadas - variaveis mantidas (\\$sucessos/\\$total)\\" }; :log info \\"Finalizado\\"`,
                      "Script Notificador PIX"
                    )}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar
                  </Button>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg font-mono text-sm overflow-x-auto">
                  /system script add name="notificador-pix" source=":global pixMacsNotificar..."
                </div>
              </div>

              {/* Passo 5: Script Notificador Desconectado */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-lg">5. Script Notificador Desconectado - COM RETRY E LIMPEZA CONDICIONAL</h4>
                  <Button
                    size="sm"
                    onClick={() => handleCopyCommand(
                      `/system script add name="notificador-desconectado" source=":global pixMacsDesconectar; :log info \\"Notificador desconectado iniciado\\"; :log info \\"MACs: \\$pixMacsDesconectar\\"; :local url \\"https://api.lucro.top/api/mikrotik/auth-notification\\"; :local pos 0; :local sucessos 0; :local total 0; :while ([:find \\$pixMacsDesconectar \\";\\\" \\$pos] >= 0) do={ :local fim [:find \\$pixMacsDesconectar \\";\\\" \\$pos]; :local mac [:pick \\$pixMacsDesconectar \\$pos \\$fim]; :if ([:len \\$mac] > 0) do={ :set total (\\$total + 1); :log info \\"Processando desconexao: \\$mac\\"; :local data \\"{\\\\\\"token\\\\\\":\\\\\\"${selectedInstallMikrotik.api_token}\\\\\\",\\\\\\"mac_address\\\\\\":\\\\\\"\\$mac\\\\\\",\\\\\\"mikrotik_id\\\\\\":\\\\\\"${selectedInstallMikrotik.id}\\\\\\",\\\\\\"action\\\\\\":\\\\\\"disconnect\\\\\\"}\\\"; :local tentativa 1; :local enviado false; :while (\\$tentativa <= 3 and !\\$enviado) do={ :log info \\"Tentativa \\$tentativa desconexao: \\$mac\\"; :do { /tool fetch url=\\$url http-method=post http-header-field=\\"Content-Type: application/json\\" http-data=\\$data keep-result=no; :set enviado true; :set sucessos (\\$sucessos + 1); :log info \\"Sucesso desconexao: \\$mac\\" } on-error={ :log error \\"Erro tentativa \\$tentativa desconexao: \\$mac\\"; :set tentativa (\\$tentativa + 1); :if (\\$tentativa <= 3) do={ :delay 1s } } }; :if (!\\$enviado) do={ :log error \\"Falha total desconexao: \\$mac\\" } }; :set pos (\\$fim + 1) }; :if (\\$sucessos = \\$total and \\$total > 0) do={ :set pixMacsDesconectar; :log info \\"Todas desconexoes enviadas - variavel limpa (\\$sucessos/\\$total)\\" } else={ :log warning \\"Falhas detectadas - variavel mantida (\\$sucessos/\\$total)\\" }; :log info \\"Notificador desconectado finalizado\\"`,
                      "Script Notificador Desconectado"
                    )}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar
                  </Button>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg font-mono text-sm overflow-x-auto">
                  /system script add name="notificador-desconectado" source=":global pixMacsDesconectar..."
                </div>
              </div>

              {/* Passo 6: Schedulers */}
              <div className="space-y-3">
                <h4 className="font-semibold text-lg">6. Criar Schedulers (copie um por vez)</h4>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Scheduler Verificador (40s)</span>
                    <Button
                      size="sm"
                      onClick={() => handleCopyCommand(
                        `/system scheduler add name="pix-verificador-scheduler" start-time=startup interval=40s on-event="/system script run pix-verificador"`,
                        "Scheduler Verificador"
                      )}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copiar
                    </Button>
                  </div>
                  <div className="p-2 bg-gray-50 rounded font-mono text-xs overflow-x-auto">
                    /system scheduler add name="pix-verificador-scheduler" start-time=startup interval=40s on-event="/system script run pix-verificador"
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Scheduler Limpeza (2min)</span>
                    <Button
                      size="sm"
                      onClick={() => handleCopyCommand(
                        `/system scheduler add name="pix-limpeza-scheduler" start-time=startup interval=2m on-event="/system script run pix-limpeza"`,
                        "Scheduler Limpeza"
                      )}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copiar
                    </Button>
                  </div>
                  <div className="p-2 bg-gray-50 rounded font-mono text-xs overflow-x-auto">
                    /system scheduler add name="pix-limpeza-scheduler" start-time=startup interval=2m on-event="/system script run pix-limpeza"
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Scheduler Heartbeat (5min)</span>
                    <Button
                      size="sm"
                      onClick={() => handleCopyCommand(
                        `/system scheduler add name="pix-heartbeat-scheduler" start-time=startup interval=5m on-event="/system script run pix-heartbeat"`,
                        "Scheduler Heartbeat"
                      )}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copiar
                    </Button>
                  </div>
                  <div className="p-2 bg-gray-50 rounded font-mono text-xs overflow-x-auto">
                    /system scheduler add name="pix-heartbeat-scheduler" start-time=startup interval=5m on-event="/system script run pix-heartbeat"
                  </div>
                </div>
              </div>

              {/* Passo 7: Testes */}
              <div className="space-y-3">
                <h4 className="font-semibold text-lg">7. Testar Instalação</h4>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Teste Heartbeat</span>
                    <Button
                      size="sm"
                      onClick={() => handleCopyCommand(
                        `/system script run pix-heartbeat`,
                        "Teste Heartbeat"
                      )}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copiar
                    </Button>
                  </div>
                  <div className="p-2 bg-gray-50 rounded font-mono text-xs">
                    /system script run pix-heartbeat
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Teste Verificador</span>
                    <Button
                      size="sm"
                      onClick={() => handleCopyCommand(
                        `/system script run pix-verificador`,
                        "Teste Verificador"
                      )}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copiar
                    </Button>
                  </div>
                  <div className="p-2 bg-gray-50 rounded font-mono text-xs">
                    /system script run pix-verificador
                  </div>
                </div>
              </div>

              {/* Passo 8: Verificação */}
              <div className="space-y-3">
                <h4 className="font-semibold text-lg">8. Verificar Instalação</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Ver Scripts</span>
                      <Button
                        size="sm"
                        onClick={() => handleCopyCommand(
                          `/system script print`,
                          "Ver Scripts"
                        )}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="p-2 bg-gray-50 rounded font-mono text-xs">
                      /system script print
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Ver Schedulers</span>
                      <Button
                        size="sm"
                        onClick={() => handleCopyCommand(
                          `/system scheduler print`,
                          "Ver Schedulers"
                        )}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="p-2 bg-gray-50 rounded font-mono text-xs">
                      /system scheduler print
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Ver Logs</span>
                      <Button
                        size="sm"
                        onClick={() => handleCopyCommand(
                          `/log print where topics~"script"`,
                          "Ver Logs"
                        )}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="p-2 bg-gray-50 rounded font-mono text-xs">
                      /log print where topics~"script"
                    </div>
                  </div>
                </div>
              </div>

              {/* Novidades dos Notificadores */}
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🚀</span>
                  <div>
                    <h5 className="font-semibold text-green-800 mb-2">Novidades dos Notificadores Aprimorados</h5>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• <strong>Sistema de Retry:</strong> 3 tentativas automáticas com delay de 1s entre elas</li>
                      <li>• <strong>Limpeza Condicional:</strong> só limpa variáveis se TODAS as notificações foram enviadas</li>
                      <li>• <strong>Logs Detalhados:</strong> mostra progresso individual e resultado final (sucessos/total)</li>
                      <li>• <strong>Controle de Falhas:</strong> mantém variáveis se houver falhas para retry posterior</li>
                      <li>• <strong>Maior Confiabilidade:</strong> reduz perda de notificações por problemas temporários</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Aviso importante */}
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h5 className="font-semibold text-yellow-800 mb-1">Instruções Importantes</h5>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      <li>• Copie e cole cada comando separadamente no terminal do MikroTik</li>
                      <li>• Aguarde a confirmação de cada comando antes de colar o próximo</li>
                      <li>• Verifique os logs após a instalação para confirmar funcionamento</li>
                      <li>• Scripts criados: verificador, limpeza, heartbeat, notificador-pix, notificador-desconectado</li>
                      <li>• Schedulers: verificador (40s), limpeza (2min), heartbeat (5min)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowInstallModal(false)}
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MikrotiksManagement;
