import React, { useState, useEffect } from 'react';
import { 
  Save, 
  RefreshCw, 
  Settings, 
  Globe, 
  Search, 
  Palette, 
  Shield, 
  BarChart3,
  Mail,
  Upload,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

interface SiteSetting {
  id: string;
  key: string;
  value: string;
  type: 'string' | 'number' | 'boolean' | 'json' | 'file';
  category: string;
  label: string;
  description: string;
  is_public: boolean;
}

interface SettingsByCategory {
  [category: string]: SiteSetting[];
}

const categoryIcons = {
  general: Globe,
  seo: Search,
  analytics: BarChart3,
  contact: Mail,
  appearance: Palette,
  system: Shield,
  localization: Settings,
};

const categoryLabels = {
  general: 'Geral',
  seo: 'SEO',
  analytics: 'Analytics',
  contact: 'Contato',
  appearance: 'Aparência',
  system: 'Sistema',
  localization: 'Localização',
};

export default function SiteSettings() {
  const [settings, setSettings] = useState<SettingsByCategory>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error' | 'info', text: string} | null>(null);
  const [activeCategory, setActiveCategory] = useState('general');
  const [showSecrets, setShowSecrets] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .order('category, key');

      if (error) {
        throw error;
      }

      // Agrupar por categoria
      const grouped = (data || []).reduce((acc, setting) => {
        if (!acc[setting.category]) {
          acc[setting.category] = [];
        }
        acc[setting.category].push(setting);
        return acc;
      }, {} as SettingsByCategory);

      setSettings(grouped);
    } catch (error: any) {
      console.error('Erro ao carregar configurações:', error);
      setMessage({
        type: 'error',
        text: 'Erro ao carregar configurações: ' + error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (key: string, value: string) => {
    setSettings(prev => {
      const newSettings = { ...prev };
      Object.keys(newSettings).forEach(category => {
        newSettings[category] = newSettings[category].map(setting => 
          setting.key === key ? { ...setting, value } : setting
        );
      });
      return newSettings;
    });
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      setMessage(null);

      // Preparar todas as configurações para salvar
      const allSettings = Object.values(settings).flat();
      
      // Salvar uma por uma (Supabase não suporta bulk upsert facilmente)
      const promises = allSettings.map(setting => 
        supabase
          .from('site_settings')
          .upsert({
            key: setting.key,
            value: setting.value,
            type: setting.type,
            category: setting.category,
            label: setting.label,
            description: setting.description,
            is_public: setting.is_public,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'key'
          })
      );

      const results = await Promise.all(promises);
      
      // Verificar se houve erros
      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        throw new Error(`Erro ao salvar ${errors.length} configuração(ões)`);
      }

      setMessage({
        type: 'success',
        text: 'Configurações salvas com sucesso!'
      });

      // Recarregar configurações para sincronizar
      await loadSettings();
    } catch (error: any) {
      console.error('Erro ao salvar configurações:', error);
      setMessage({
        type: 'error',
        text: 'Erro ao salvar configurações: ' + error.message
      });
    } finally {
      setSaving(false);
    }
  };

  const renderSettingInput = (setting: SiteSetting) => {
    const isSecret = setting.key.includes('key') || setting.key.includes('token') || setting.key.includes('secret');
    
    switch (setting.type) {
      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={setting.value === 'true'}
              onChange={(e) => handleSettingChange(setting.key, e.target.checked ? 'true' : 'false')}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600">
              {setting.value === 'true' ? 'Ativado' : 'Desativado'}
            </span>
          </div>
        );
      
      case 'number':
        return (
          <input
            type="number"
            value={setting.value}
            onChange={(e) => handleSettingChange(setting.key, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );
      
      case 'json':
        return (
          <textarea
            value={setting.value}
            onChange={(e) => handleSettingChange(setting.key, e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            placeholder='{"key": "value"}'
          />
        );
      
      default:
        return (
          <div className="relative">
            <input
              type={isSecret && !showSecrets ? 'password' : 'text'}
              value={setting.value}
              onChange={(e) => handleSettingChange(setting.key, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {isSecret && (
              <button
                type="button"
                onClick={() => setShowSecrets(!showSecrets)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showSecrets ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            )}
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="bg-gray-200 rounded-lg h-64"></div>
            <div className="lg:col-span-3 bg-gray-200 rounded-lg h-64"></div>
          </div>
        </div>
      </div>
    );
  }

  const categories = Object.keys(settings);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Configurações do Site</h1>
          <p className="text-gray-600 mt-1">Gerencie as configurações gerais, SEO, analytics e mais</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={loadSettings}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Recarregar
          </button>
          <button
            onClick={saveSettings}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Save className={`w-4 h-4 ${saving ? 'animate-pulse' : ''}`} />
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </div>

      {message && (
        <div className={`flex items-center gap-2 p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
          message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
          'bg-blue-50 text-blue-700 border border-blue-200'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> :
           message.type === 'error' ? <AlertCircle className="w-5 h-5" /> :
           <Info className="w-5 h-5" />}
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar de categorias */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Categorias</CardTitle>
              <CardDescription>Selecione uma categoria para editar</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <nav className="space-y-1">
                {categories.map((category) => {
                  const Icon = categoryIcons[category as keyof typeof categoryIcons] || Settings;
                  const isActive = activeCategory === category;
                  
                  return (
                    <button
                      key={category}
                      onClick={() => setActiveCategory(category)}
                      className={`w-full flex items-center px-4 py-3 text-left transition-colors ${
                        isActive 
                          ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600' 
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                      <div>
                        <p className="font-medium">
                          {categoryLabels[category as keyof typeof categoryLabels] || category}
                        </p>
                        <p className="text-xs text-gray-500">
                          {settings[category]?.length || 0} configurações
                        </p>
                      </div>
                    </button>
                  );
                })}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Conteúdo das configurações */}
        <div className="lg:col-span-3">
          {settings[activeCategory] && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {React.createElement(
                    categoryIcons[activeCategory as keyof typeof categoryIcons] || Settings,
                    { className: "w-5 h-5" }
                  )}
                  {categoryLabels[activeCategory as keyof typeof categoryLabels] || activeCategory}
                </CardTitle>
                <CardDescription>
                  Configure as opções de {(categoryLabels[activeCategory as keyof typeof categoryLabels] || activeCategory).toLowerCase()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {settings[activeCategory].map((setting) => (
                  <div key={setting.key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">
                        {setting.label}
                      </label>
                      {!setting.is_public && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          <Shield className="w-3 h-3 mr-1" />
                          Privado
                        </span>
                      )}
                    </div>
                    
                    {setting.description && (
                      <p className="text-sm text-gray-500">{setting.description}</p>
                    )}
                    
                    {renderSettingInput(setting)}
                    
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>Chave: {setting.key}</span>
                      <span>Tipo: {setting.type}</span>
                    </div>
                  </div>
                ))}
                
                {settings[activeCategory].length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Settings className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Nenhuma configuração encontrada nesta categoria</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Informações adicionais */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5" />
              Sobre as Configurações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-600">
            <p>• <strong>Configurações Públicas:</strong> Visíveis para todos os usuários</p>
            <p>• <strong>Configurações Privadas:</strong> Visíveis apenas para administradores</p>
            <p>• <strong>Campos Secretos:</strong> Mascarados por padrão (tokens, chaves, etc.)</p>
            <p>• <strong>Tipos:</strong> string (texto), number (número), boolean (sim/não), json (objeto)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Importante
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-600">
            <p>• Alterações em configurações de SEO podem afetar o rankeamento</p>
            <p>• Configurações de analytics requerem IDs válidos</p>
            <p>• Modo de manutenção bloqueia acesso de usuários normais</p>
            <p>• Sempre teste as alterações antes de aplicar em produção</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 