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
  Percent,
  TrendingUp,
  Key,
  Copy,
  Eye,
  EyeOff,
  Download
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

  const handleCopyInstallationCode = async (mikrotik: Mikrotik) => {
    if (!mikrotik.api_token) {
      toast({
        title: "Token necessário",
        description: "Este MikroTik precisa de um token para gerar o código de instalação",
        variant: "destructive"
      });
      return;
    }

    const installationCode = `# ============================================================================
# INSTALAÇÃO COMPLETA - SISTEMA PIX MIKROTIK
# API: https://api.lucro.top
# MikroTik: ${mikrotik.nome}
# MikroTik ID: ${mikrotik.id}
# Token: ${mikrotik.api_token}
# ============================================================================

# PASSO 1: Criar script verificador de pagamentos
/system script add name="pix-verificador" source={
:local apiUrl "https://api.lucro.top/api/recent-sales"
:local mikrotikId "${mikrotik.id}"
:local apiToken "${mikrotik.api_token}"
:log info "=== PIX VERIFICADOR INICIADO ==="
:local macs ""
:local tentativas 5
:for tentativa from=1 to=\\$tentativas do={
    :log info "Tentativa \\$tentativa de \\$tentativas"
    :local jsonData "{\\"mikrotik_id\\":\\"\\$mikrotikId\\",\\"token\\":\\"\\$apiToken\\"}"
    :do {
        /tool fetch url=\\$apiUrl http-method=post http-header-field="Content-Type:application/json" http-data=\\$jsonData dst-path="vendas.txt"
        :delay 2s
        :if ([/file find name="vendas.txt"] != "") do={
            :local vendas [/file get [find name="vendas.txt"] contents]
            /file remove [find name="vendas.txt"]
            :if ([:len \\$vendas] > 0) do={
                :log info "Vendas encontradas: \\$vendas"
                :local pos [:find \\$vendas "-"]
                :if (\\$pos >= 0) do={
                    :local mac [:pick \\$vendas 0 \\$pos]
                    :local resto [:pick \\$vendas (\\$pos + 1) [:len \\$vendas]]
                    :local pos2 [:find \\$resto "-"]
                    :local senha [:pick \\$resto 0 \\$pos2]
                    :local resto2 [:pick \\$resto (\\$pos2 + 1) [:len \\$resto]]
                    :local pos3 [:find \\$resto2 "-"]
                    :local macAddr [:pick \\$resto2 0 \\$pos3]
                    :local minutos [:tonum [:pick \\$resto2 (\\$pos3 + 1) [:len \\$resto2]]]
                    :log info "Processando: MAC=\\$macAddr, Minutos=\\$minutos"
                    :if ([:find \\$macs \\$macAddr] < 0) do={
                        :do { /ip hotspot ip-binding remove [find mac-address=\\$macAddr] } on-error={}
                        :local agora [/system clock get time]
                        :local h [:tonum [:pick \\$agora 0 2]]
                        :local m [:tonum [:pick \\$agora 3 5]]
                        :local novoMin ((\\$h * 60) + \\$m + \\$minutos)
                        :local novaH (\\$novoMin / 60)
                        :local novaM (\\$novoMin % 60)
                        :if (\\$novaH >= 24) do={ :set novaH (\\$novaH - 24) }
                        :local hs [:tostr \\$novaH]
                        :local ms [:tostr \\$novaM]
                        :if ([:len \\$hs] = 1) do={ :set hs ("0" . \\$hs) }
                        :if ([:len \\$ms] = 1) do={ :set ms ("0" . \\$ms) }
                        :local dataExpire ([/system clock get date] . "-" . \\$hs . \\$ms)
                        :local comentario ("PIX-EXPIRE-" . \\$dataExpire . "-" . \\$macAddr)
                        /ip hotspot ip-binding add mac-address=\\$macAddr type=bypassed comment=\\$comentario
                        :log info "Binding criado: \\$macAddr expira em \\$dataExpire"
                        :set macs (\\$macs . \\$macAddr . ";")
                    }
                }
                :set tentativa \\$tentativas
            } else={ :log info "Nenhuma venda nova encontrada" }
        } else={ :log error "Arquivo vendas.txt não foi criado" }
    } on-error={ :log error "Erro na tentativa \\$tentativa: \\$!" }
}
:if ([:len \\$macs] > 0) do={
    :global pixMacsNotificar \\$macs
    :global pixAcaoNotificar "connect"
    :log info "Executando notificador para MACs: \\$macs"
    :do { /system script run notificador-pix } on-error={ :log error "Erro ao executar notificador: \\$!" }
} else={ :log info "Nenhum MAC novo processado" }
:log info "=== PIX VERIFICADOR CONCLUIDO ==="
}

# PASSO 2: Criar script de limpeza
/system script add name="pix-limpeza" source={
:local mikrotikId "${mikrotik.id}"
:local apiToken "${mikrotik.api_token}"
:log info "=== LIMPEZA AUTOMATICA INICIADA ==="
:local agora [/system clock get time]
:local hoje [/system clock get date]
:local h [:tonum [:pick \\$agora 0 [:find \\$agora ":"]]]
:local m [:tonum [:pick \\$agora 3 5]]
:local minAtual ((\\$h * 60) + \\$m)
:local pos1 [:find \\$hoje "-"]
:local anoAtual [:tonum [:pick \\$hoje 0 \\$pos1]]
:local resto1 [:pick \\$hoje (\\$pos1 + 1) [:len \\$hoje]]
:local pos2 [:find \\$resto1 "-"]
:local mesAtual [:tonum [:pick \\$resto1 0 \\$pos2]]
:local diaAtual [:tonum [:pick \\$resto1 (\\$pos2 + 1) [:len \\$resto1]]]
:log info "Data/Hora atual: \\$anoAtual-\\$mesAtual-\\$diaAtual \\$h:\\$m"
:local macsExpirados ""
:local removidos 0
:local total 0
:foreach binding in=[/ip hotspot ip-binding find where comment~"PIX-EXPIRE-"] do={
    :set total (\\$total + 1)
    :local comentario [/ip hotspot ip-binding get \\$binding comment]
    :local macAddress [/ip hotspot ip-binding get \\$binding mac-address]
    :local pos [:find \\$comentario "PIX-EXPIRE-"]
    :local dados [:pick \\$comentario (\\$pos + 11) [:len \\$comentario]]
    :local p1 [:find \\$dados "-"]
    :local ano [:tonum [:pick \\$dados 0 \\$p1]]
    :local resto1 [:pick \\$dados (\\$p1 + 1) [:len \\$dados]]
    :local p2 [:find \\$resto1 "-"]
    :local mes [:tonum [:pick \\$resto1 0 \\$p2]]
    :local resto2 [:pick \\$resto1 (\\$p2 + 1) [:len \\$resto1]]
    :local p3 [:find \\$resto2 "-"]
    :local dia [:tonum [:pick \\$resto2 0 \\$p3]]
    :local resto3 [:pick \\$resto2 (\\$p3 + 1) [:len \\$resto2]]
    :local p4 [:find \\$resto3 "-"]
    :local horaStr [:pick \\$resto3 0 \\$p4]
    :local horas [:tonum [:pick \\$horaStr 0 2]]
    :local mins [:tonum [:pick \\$horaStr 2 4]]
    :local minExpire ((\\$horas * 60) + \\$mins)
    :local expirou false
    :local dataAtualNum ((\\$anoAtual * 10000) + (\\$mesAtual * 100) + \\$diaAtual)
    :local dataExpireNum ((\\$ano * 10000) + (\\$mes * 100) + \\$dia)
    :if (\\$dataExpireNum < \\$dataAtualNum) do={ :set expirou true }
    :if (\\$dataExpireNum = \\$dataAtualNum and \\$minExpire <= \\$minAtual) do={ :set expirou true }
    :if (\\$expirou) do={
        :log info "REMOVENDO binding: \\$macAddress"
        :do {
            /ip hotspot ip-binding remove \\$binding
            :set macsExpirados (\\$macsExpirados . \\$macAddress . ";")
            :set removidos (\\$removidos + 1)
        } on-error={ :log error "Erro ao remover binding: \\$macAddress" }
    }
}
:if ([:len \\$macsExpirados] > 0) do={
    :global pixMacsDesconectar \\$macsExpirados
    :do { /system script run notificador-desconectado } on-error={}
}
:log info "=== LIMPEZA CONCLUIDA: Total=\\$total Removidos=\\$removidos ==="
}

# PASSO 3: Criar script de heartbeat
/system script add name="pix-heartbeat" source={
:local apiUrl "https://api.lucro.top/api/mikrotik/heartbeat"
:local mikrotikId "${mikrotik.id}"
:local apiToken "${mikrotik.api_token}"
:local version [/system resource get version]
:local uptime [/system resource get uptime]
:local jsonData "{\\"mikrotik_id\\":\\"\\$mikrotikId\\",\\"token\\":\\"\\$apiToken\\",\\"version\\":\\"\\$version\\",\\"uptime\\":\\"\\$uptime\\"}"
:log info "=== HEARTBEAT INICIADO ==="
:do {
    /tool fetch url=\\$apiUrl http-method=post http-header-field="Content-Type:application/json" http-data=\\$jsonData
    :log info "Heartbeat enviado com sucesso"
} on-error={ :log error "Erro ao enviar heartbeat: \\$!" }
:log info "=== HEARTBEAT CONCLUIDO ==="
}

# PASSO 4: Criar schedulers
/system scheduler add name="pix-verificador-scheduler" start-time=startup interval=40s on-event="/system script run pix-verificador"
/system scheduler add name="pix-limpeza-scheduler" start-time=startup interval=2m on-event="/system script run pix-limpeza"
/system scheduler add name="pix-heartbeat-scheduler" start-time=startup interval=5m on-event="/system script run pix-heartbeat"

# PASSO 5: Executar teste inicial
:log info "=== INSTALACAO COMPLETA FINALIZADA ==="
:log info "Scripts criados: pix-verificador, pix-limpeza, pix-heartbeat"
:log info "Schedulers criados: verificador (40s), limpeza (2m), heartbeat (5m)"
:log info "Executando teste de heartbeat..."
/system script run pix-heartbeat`;

    try {
      await navigator.clipboard.writeText(installationCode);
      toast({
        title: "Código copiado!",
        description: `Código de instalação completo para ${mikrotik.nome} copiado para a área de transferência`,
      });
    } catch (err) {
      toast({
        title: "Erro",
        description: "Erro ao copiar código de instalação",
        variant: "destructive"
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
    <div className="space-y-6">
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <CardTitle className="text-sm font-medium">Lucro Médio</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {mikrotiks.length > 0 
                ? (mikrotiks.reduce((acc, m) => acc + m.profitpercentage, 0) / mikrotiks.length).toFixed(1)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Média de todos os equipamentos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Equipamentos Ativos</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {mikrotiks.filter(m => m.status === 'Ativo').length}
            </div>
            <p className="text-xs text-muted-foreground">
              De {mikrotiks.length} total
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
      </div>

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
                          onClick={() => handleCopyInstallationCode(mikrotik)}
                          className="text-blue-600"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Copiar Código de Instalação
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
    </div>
  );
};

export default MikrotiksManagement;
