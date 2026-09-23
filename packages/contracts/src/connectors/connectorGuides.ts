import type { Connector, ConnectorKey } from "./connectorCatalog";

export type ConnectorModality = { key: string; label: string; help: string };

export type ConnectorGuide = { steps: string[]; modalities: ConnectorModality[] };

const oauthSteps = (platform: string, account: string): string[] => [
  `Clique em "Conectar" e entre com ${account}.`,
  `Na tela da ${platform}, autorize o E-commerce Insights a ler os dados.`,
  'Se houver mais de uma conta, escolha qual usar em "Configurar".',
  "Aguarde a primeira importação: o andamento aparece aqui mesmo, em Conexões.",
];

const requestSteps = (platform: string): string[] => [
  `A integração com ${platform} ainda está sendo construída.`,
  'Clique em "Solicitar conexão" e conte como você usa a plataforma: a equipe avisa quando estiver pronta.',
  "Enquanto isso, as vendas podem entrar pelo ERP ou pela planilha.",
];

const amazonModalities: ConnectorModality[] = [
  {
    key: "mfn",
    label: "Amazon (MFN)",
    help: "Você guarda o estoque e envia os pedidos; a nota sai do seu ERP.",
  },
  {
    key: "fba_classic",
    label: "FBA Classic",
    help: "O estoque fica no armazém da Amazon, que envia e emite a nota. O estoque é da Amazon: só leitura aqui.",
  },
  {
    key: "fba_onsite",
    label: "FBA Onsite",
    help: "A Amazon opera a partir do seu armazém; o estoque não é sincronizado.",
  },
];

const mercadoLivreModalities: ConnectorModality[] = [
  {
    key: "own",
    label: "Envio próprio",
    help: "Você guarda o estoque e envia os pedidos (Mercado Envios ou Flex).",
  },
  {
    key: "full",
    label: "Full",
    help: "O estoque fica no centro de distribuição do Mercado Livre, que envia e emite a nota. O estoque é do Mercado Livre: só leitura aqui.",
  },
];

export const connectorGuides: Record<ConnectorKey, ConnectorGuide> = {
  bling: { steps: oauthSteps("Bling", "o usuário administrador do Bling"), modalities: [] },
  tiny: {
    steps: [
      "No Tiny, abra as configurações da conta e gere o token de acesso à API.",
      "Copie o token e cole no campo desta integração.",
      'Clique em "Testar" para conferir e depois em "Conectar".',
    ],
    modalities: [],
  },
  omie: {
    steps: [
      "No portal de desenvolvedores do Omie, abra o aplicativo da sua empresa.",
      "Copie a App Key e o App Secret e cole nos campos desta integração.",
      'Clique em "Testar" para conferir e depois em "Conectar".',
    ],
    modalities: [],
  },
  shopify: {
    steps: [
      "Informe o endereço interno da loja (termina em .myshopify.com).",
      ...oauthSteps("Shopify", "a conta proprietária da loja").slice(1),
    ],
    modalities: [],
  },
  nuvemshop: {
    steps: [
      "Informe o endereço da loja.",
      ...oauthSteps("Nuvemshop", "a conta dona da loja").slice(1),
    ],
    modalities: [],
  },
  vtex: { steps: requestSteps("VTEX"), modalities: [] },
  mercado_livre: {
    steps: oauthSteps("Mercado Livre", "a conta vendedora do Mercado Livre"),
    modalities: mercadoLivreModalities,
  },
  amazon: {
    steps: [
      'Clique em "Conectar": a autorização é concluída dentro do Seller Central.',
      "Entre com a conta administradora do Seller Central (Amazon.com.br) e autorize.",
      "Aguarde a primeira importação: o andamento aparece aqui mesmo, em Conexões.",
    ],
    modalities: amazonModalities,
  },
  shopee: { steps: requestSteps("Shopee"), modalities: [] },
  magalu: { steps: requestSteps("Magalu"), modalities: [] },
  tiktok_shop: { steps: requestSteps("TikTok Shop"), modalities: [] },
  meta_ads: {
    steps: oauthSteps("Meta", "o seu perfil do Facebook que acessa o Gerenciador de Negócios"),
    modalities: [],
  },
  instagram: {
    steps: [
      "Confirme que o Instagram é conta profissional e está ligado a uma Página do Facebook.",
      ...oauthSteps("Meta", "o perfil do Facebook que administra a Página").slice(0, 3),
    ],
    modalities: [],
  },
  google_ads: {
    steps: oauthSteps("Google", "a conta Google que acessa o Google Ads"),
    modalities: [],
  },
  tiktok_ads: {
    steps: oauthSteps("TikTok", "a conta do TikTok for Business"),
    modalities: [],
  },
  mercado_ads: { steps: requestSteps("Mercado Ads"), modalities: [] },
  amazon_ads: { steps: requestSteps("Amazon Ads"), modalities: [] },
  shopee_ads: { steps: requestSteps("Shopee Ads"), modalities: [] },
  ga4: {
    steps: oauthSteps("Google", "a conta Google que é Leitor ou Editor da propriedade do GA4"),
    modalities: [],
  },
  manual_csv: {
    steps: [
      "Baixe o modelo da planilha do tipo que quer importar (pedidos, mídia ou tráfego).",
      "Preencha ou exporte os dados no mesmo formato e envie o arquivo aqui.",
      "Confira a prévia antes de confirmar; uma importação pode ser desfeita depois.",
    ],
    modalities: [],
  },
};

export const guideSteps = (
  connector: Pick<Connector, "key" | "label" | "availability">,
): string[] =>
  connector.availability === "request"
    ? requestSteps(connector.label)
    : connectorGuides[connector.key].steps;
