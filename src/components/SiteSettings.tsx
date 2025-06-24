import React, { useState, useEffect, useRef } from 'react';
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
  Info,
  Image,
  X,
  Plus,
  FileText,
  Monitor
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
  social: Monitor,
  security: Shield,
};

const categoryLabels = {
  general: 'Geral',
  seo: 'SEO & Meta Tags',
  analytics: 'Analytics',
  contact: 'Contato',
  appearance: 'Aparência',
  system: 'Sistema',
  localization: 'Localização',
  social: 'Redes Sociais',
  security: 'Segurança',
};

const defaultSettings = {
  // Geral
  site_name: { label: 'Nome do Site', description: 'Nome principal do site', type: 'string', category: 'general', is_public: true },
  site_description: { label: 'Descrição do Site', description: 'Descrição curta do site', type: 'string', category: 'general', is_public: true },
  site_logo: { label: 'Logo do Site', description: 'URL do logo principal', type: 'file', category: 'general', is_public: true },
  site_favicon: { label: 'Favicon', description: 'Ícone do site (32x32px)', type: 'file', category: 'general', is_public: true },
  site_language: { label: 'Idioma', description: 'Idioma padrão do site', type: 'string', category: 'general', is_public: true },
  
  // SEO
  meta_title: { label: 'Título Meta', description: 'Título principal para SEO', type: 'string', category: 'seo', is_public: true },
  meta_description: { label: 'Descrição Meta', description: 'Descrição meta para SEO', type: 'string', category: 'seo', is_public: true },
  meta_keywords: { label: 'Palavras-chave', description: 'Palavras-chave separadas por vírgula', type: 'string', category: 'seo', is_public: true },
  meta_author: { label: 'Autor', description: 'Autor do site', type: 'string', category: 'seo', is_public: true },
  robots_txt: { label: 'Robots.txt', description: 'Conteúdo do arquivo robots.txt', type: 'string', category: 'seo', is_public: true },
  
  // Open Graph
  og_title: { label: 'OG Título', description: 'Título para redes sociais', type: 'string', category: 'seo', is_public: true },
  og_description: { label: 'OG Descrição', description: 'Descrição para redes sociais', type: 'string', category: 'seo', is_public: true },
  og_image: { label: 'OG Imagem', description: 'Imagem para compartilhamento (1200x630px)', type: 'file', category: 'seo', is_public: true },
  og_type: { label: 'OG Tipo', description: 'Tipo de conteúdo OpenGraph', type: 'string', category: 'seo', is_public: true },
  
  // Twitter
  twitter_card: { label: 'Twitter Card', description: 'Tipo de card do Twitter', type: 'string', category: 'seo', is_public: true },
  twitter_site: { label: 'Twitter Site', description: '@username do site no Twitter', type: 'string', category: 'seo', is_public: true },
  
  // Aparência
  theme_primary_color: { label: 'Cor Primária', description: 'Cor principal do tema', type: 'string', category: 'appearance', is_public: true },
  theme_secondary_color: { label: 'Cor Secundária', description: 'Cor secundária do tema', type: 'string', category: 'appearance', is_public: true },
  theme_dark_mode: { label: 'Modo Escuro', description: 'Ativar modo escuro por padrão', type: 'boolean', category: 'appearance', is_public: true },
  
  // Analytics
  google_analytics_id: { label: 'Google Analytics ID', description: 'ID do Google Analytics (GA4)', type: 'string', category: 'analytics', is_public: false },
  google_tag_manager_id: { label: 'Google Tag Manager ID', description: 'ID do Google Tag Manager', type: 'string', category: 'analytics', is_public: false },
  facebook_pixel_id: { label: 'Facebook Pixel ID', description: 'ID do Facebook Pixel', type: 'string', category: 'analytics', is_public: false },
  
  // Contato
  contact_email: { label: 'Email de Contato', description: 'Email principal para contato', type: 'string', category: 'contact', is_public: true },
  contact_phone: { label: 'Telefone', description: 'Telefone para contato', type: 'string', category: 'contact', is_public: true },
  contact_whatsapp: { label: 'WhatsApp', description: 'Número do WhatsApp', type: 'string', category: 'contact', is_public: true },
  contact_address: { label: 'Endereço', description: 'Endereço físico', type: 'string', category: 'contact', is_public: true },
  
  // Sistema
  maintenance_mode: { label: 'Modo Manutenção', description: 'Ativar modo de manutenção', type: 'boolean', category: 'system', is_public: false },
  max_upload_size: { label: 'Tamanho Máximo Upload', description: 'Tamanho máximo em MB', type: 'number', category: 'system', is_public: false },
  session_timeout: { label: 'Timeout da Sessão', description: 'Tempo em minutos', type: 'number', category: 'system', is_public: false },
};

export default function SiteSettings() {
  const [settings, setSettings] = useState<SettingsByCategory>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error' | 'info', text: string} | null>(null);
  const [activeCategory, setActiveCategory] = useState('general');
  const [showSecrets, setShowSecrets] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<{[key: string]: boolean}>({});
  const fileInputRefs = useRef<{[key: string]: HTMLInputElement | null}>({});

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

  const handleFileUpload = async (key: string, file: File) => {
    try {
      setUploadingFiles(prev => ({ ...prev, [key]: true }));
      
      // Validar tipo de arquivo
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Tipo de arquivo não permitido. Use: JPG, PNG, GIF, WebP ou SVG');
      }

      // Validar tamanho (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Arquivo muito grande. Máximo 5MB');
      }

      // Upload para Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${key}-${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('site-assets')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw error;
      }

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('site-assets')
        .getPublicUrl(fileName);

      // Atualizar configuração
      handleSettingChange(key, publicUrl);
      
      setMessage({
        type: 'success',
        text: 'Arquivo enviado com sucesso!'
      });
    } catch (error: any) {
      console.error('Erro no upload:', error);
      setMessage({
        type: 'error',
        text: 'Erro no upload: ' + error.message
      });
    } finally {
      setUploadingFiles(prev => ({ ...prev, [key]: false }));
    }
  };

  const initializeDefaultSettings = async () => {
    try {
      setSaving(true);
      setMessage(null);

      const existingKeys = Object.values(settings).flat().map(s => s.key);
      const newSettings = [];

      for (const [key, config] of Object.entries(defaultSettings)) {
        if (!existingKeys.includes(key)) {
          newSettings.push({
            key,
            value: config.type === 'boolean' ? 'false' : '',
            type: config.type,
            category: config.category,
            label: config.label,
            description: config.description,
            is_public: config.is_public
          });
        }
      }

      if (newSettings.length > 0) {
        const { error } = await supabase
          .from('site_settings')
          .insert(newSettings);

        if (error) {
          throw error;
        }

        setMessage({
          type: 'success',
          text: `${newSettings.length} configurações padrão adicionadas!`
        });

        await loadSettings();
      } else {
        setMessage({
          type: 'info',
          text: 'Todas as configurações padrão já existem.'
        });
      }
    } catch (error: any) {
      console.error('Erro ao inicializar configurações:', error);
      setMessage({
        type: 'error',
        text: 'Erro ao inicializar configurações: ' + error.message
      });
    } finally {
      setSaving(false);
    }
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
    const isSecret = setting.key.includes('key') || setting.key.includes('token') || setting.key.includes('secret') || setting.key.includes('id');
    const isUploading = uploadingFiles[setting.key];
    
    switch (setting.type) {
      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Switch
              checked={setting.value === 'true'}
              onCheckedChange={(checked) => handleSettingChange(setting.key, checked ? 'true' : 'false')}
            />
            <span className="text-sm text-gray-600">
              {setting.value === 'true' ? 'Ativado' : 'Desativado'}
            </span>
          </div>
        );
      
      case 'number':
        return (
          <Input
            type="number"
            value={setting.value}
            onChange={(e) => handleSettingChange(setting.key, e.target.value)}
            className="w-full"
          />
        );
      
      case 'file':
        return (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Input
                type="text"
                value={setting.value}
                onChange={(e) => handleSettingChange(setting.key, e.target.value)}
                placeholder="URL do arquivo ou faça upload"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRefs.current[setting.key]?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
              </Button>
            </div>
            <input
              ref={(el) => fileInputRefs.current[setting.key] = el}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleFileUpload(setting.key, file);
                }
              }}
            />
            {setting.value && (
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Image className="w-4 h-4" />
                <span>Arquivo atual: {setting.value.split('/').pop()}</span>
              </div>
            )}
          </div>
        );
      
      case 'json':
        return (
          <Textarea
            value={setting.value}
            onChange={(e) => handleSettingChange(setting.key, e.target.value)}
            placeholder="JSON válido"
            className="w-full min-h-[100px] font-mono text-sm"
          />
        );
      
      default: // string
        if (setting.description?.includes('textarea') || setting.value.length > 100) {
          return (
            <Textarea
              value={setting.value}
              onChange={(e) => handleSettingChange(setting.key, e.target.value)}
              className="w-full min-h-[80px]"
            />
          );
        }
        
        return (
          <Input
            type={isSecret && !showSecrets ? 'password' : 'text'}
            value={setting.value}
            onChange={(e) => handleSettingChange(setting.key, e.target.value)}
            className="w-full"
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const categories = Object.keys(categoryLabels);
  const hasSettings = Object.keys(settings).length > 0;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Configurações do Site</h1>
          <p className="text-gray-600 mt-2">Configure SEO, aparência e outras opções do site</p>
        </div>
        <div className="flex items-center space-x-3">
          {!hasSettings && (
            <Button
              onClick={initializeDefaultSettings}
              disabled={saving}
              variant="outline"
            >
              {saving ? (
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Configurações Padrão
            </Button>
          )}
          <Button
            onClick={() => setShowSecrets(!showSecrets)}
            variant="outline"
            size="sm"
          >
            {showSecrets ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </Button>
          <Button
            onClick={loadSettings}
            variant="outline"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            onClick={saveSettings}
            disabled={saving}
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Salvar
          </Button>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-lg border ${
          message.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
          message.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
          'bg-blue-50 border-blue-200 text-blue-800'
        }`}>
          <div className="flex items-center space-x-2">
            {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> :
             message.type === 'error' ? <AlertCircle className="w-5 h-5" /> :
             <Info className="w-5 h-5" />}
            <span>{message.text}</span>
          </div>
        </div>
      )}

      {!hasSettings ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Settings className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma configuração encontrada</h3>
            <p className="text-gray-500 mb-4">Clique em "Configurações Padrão" para inicializar o sistema.</p>
          </CardContent>
        </Card>
      ) : (
        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-6">
            {categories.map((category) => {
              const Icon = categoryIcons[category as keyof typeof categoryIcons];
              const hasData = settings[category]?.length > 0;
              return (
                <TabsTrigger 
                  key={category} 
                  value={category}
                  className="flex items-center space-x-2"
                  disabled={!hasData}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{categoryLabels[category as keyof typeof categoryLabels]}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {categories.map((category) => (
            <TabsContent key={category} value={category}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    {React.createElement(categoryIcons[category as keyof typeof categoryIcons], { className: "w-5 h-5" })}
                    <span>{categoryLabels[category as keyof typeof categoryLabels]}</span>
                  </CardTitle>
                  <CardDescription>
                    Configure as opções de {categoryLabels[category as keyof typeof categoryLabels].toLowerCase()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {settings[category]?.map((setting) => (
                    <div key={setting.key} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-gray-900">
                            {setting.label}
                          </label>
                          {setting.description && (
                            <p className="text-sm text-gray-500">{setting.description}</p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          {!setting.is_public && (
                            <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                              Privado
                            </span>
                          )}
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            {setting.type}
                          </span>
                        </div>
                      </div>
                      {renderSettingInput(setting)}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
} 