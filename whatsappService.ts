
import { getApiConfigOnce } from './firebase';

export const formatPhone = (phone: string) => {
  let clean = phone.replace(/\D/g, '');
  // Garante o código do país 55 para números brasileiros se não houver
  if (clean.length === 10 || clean.length === 11) {
    if (!clean.startsWith('55')) {
      clean = '55' + clean;
    }
  }
  return clean;
};

/**
 * Função principal de envio. 
 * Busca as configurações no banco e decide o método de envio (API ou Link).
 */
export const sendWhatsappDirect = async (phone: string, message: string, autoOpen: boolean = false): Promise<boolean> => {
  const config = await getApiConfigOnce();
  const formattedPhone = formatPhone(phone);
  
  if (config && config.token && config.baseUrl && !autoOpen) {
    const cleanToken = config.token.trim();
    const cleanEndpoint = config.endpoint.trim().startsWith('/') ? config.endpoint.trim() : `/${config.endpoint.trim()}`;
    const normalizedBaseUrl = config.baseUrl.trim().replace(/\/$/, '');
    
    let url = `${normalizedBaseUrl}${cleanEndpoint}`;
    
    // Se estiver em navegador, um Proxy de CORS pode ser necessário se a API não suportar chamadas diretas do front
    if (config.useProxy && config.proxyUrl) {
      url = `${config.proxyUrl.trim().replace(/\/$/, '')}/${url}`;
    }

    // A maioria das APIs exige o sufixo @s.whatsapp.net para identificar o JID do usuário
    const recipientJid = formattedPhone.includes('@') ? formattedPhone : `${formattedPhone}@s.whatsapp.net`;

    const body = {
      to: recipientJid,
      text: message
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cleanToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(body),
      });

      const responseData = await response.json();

      if (!response.ok || responseData.success === false) {
        console.error("Erro na API do WhatsApp:", JSON.stringify(responseData));
        return false;
      }

      return true;
    } catch (e) {
      console.error("Erro ao enviar mensagem via API:", e);
      // Fallback para link manual se a API falhar e autoOpen estiver permitido
      if (autoOpen) {
        window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, '_blank');
      }
      return false;
    }
  }

  // Fallback: Link Direto wa.me
  const waUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
  window.open(waUrl, '_blank');
  return true;
};

// Helpers para buscar templates do banco ou usar padrões
export const getWarningMessageTemplate = async (childName: string) => {
  const config = await getApiConfigOnce();
  const template = config?.warningMessage || `⚠️ *AVISO VUMBORA:* Olá! Em [MINUTOS] minutos o tempo do(a) *[CRIANCA]* acabará. Favor se dirigir ao espaço para o checkout! ❤️`;
  return template.replace('[CRIANCA]', childName).replace('[MINUTOS]', String(config?.warningMinutes || 5));
};

export const getWelcomeMessageTemplate = async (childName: string) => {
  const config = await getApiConfigOnce();
  const template = config?.entryMessage || `🚀 *BEM-VINDO:* A diversão do(a) *[CRIANCA]* no Vumbora Brincá começou! Avisaremos quando estiver perto do fim.`;
  return template.replace('[CRIANCA]', childName);
};

export const getAcademyMessageTemplate = async (childName: string, enrollId: string) => {
  const config = await getApiConfigOnce();
  const template = config?.academyMessage || `🏋️ *NOVO PLANO:* Cadastro de *[CRIANCA]* realizado com sucesso no Plano Academia! Matrícula: *[MATRICULA]*. Seja bem-vindo!`;
  return template.replace('[CRIANCA]', childName).replace('[MATRICULA]', enrollId);
};

export const getRenewalMessageTemplate = async (childName: string, daysRemaining: number, dueDate: string) => {
  const config = await getApiConfigOnce();
  const template = config?.renewalMessage || `🔔 *AVISO DE RENOVAÇÃO:* Olá! O Plano Academia do(a) *[CRIANCA]* vence em *[DIAS]* dias (Data: [DATA_VENCIMENTO]). Garanta a renovação para não perder a diversão! 🚀`;
  return template
    .replace('[CRIANCA]', childName)
    .replace('[DIAS]', String(daysRemaining))
    .replace('[DATA_VENCIMENTO]', dueDate);
};

export const getRenewalThanksMessageTemplate = async (childName: string, planType: string) => {
  const config = await getApiConfigOnce();
  const template = config?.renewalThanksMessage || `✅ *OBRIGADO:* A renovação do Plano Academia do(a) *[CRIANCA]* ([PLANO]) foi confirmada! Diversão garantida por mais um ciclo. 🚀`;
  return template
    .replace('[CRIANCA]', childName)
    .replace('[PLANO]', planType);
};
