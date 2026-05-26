# Configuração do Módulo de Email (Resend)

## 1. Criar conta Resend (gratuito)
1. Acesse https://resend.com e clique em "Sign Up"
2. Confirme o email
3. No dashboard, vá em "API Keys" → "Create API Key"
4. Copie a chave (começa com `re_...`)

## 2. Adicionar a chave no Supabase
1. Acesse https://supabase.com/dashboard/project/tcjynyfusqkqtdohnyzq/settings/functions
2. Clique em "Add new secret"
3. Nome: `RESEND_API_KEY`
4. Valor: sua chave do Resend
5. Clique em "Save"

## 3. (Opcional) Configurar domínio próprio
Para enviar emails como `noreply@suaoficina.com.br`:
1. No Resend, vá em "Domains" → "Add Domain"
2. Siga as instruções de DNS
3. Atualize o FROM_EMAIL na Edge Function `email`

## 4. Adicionar emails dos clientes
No dashboard, aba Clientes, você pode adicionar o email de cada cliente.
O sistema dispara automaticamente:
- **Orçamento**: quando a OS está aguardando aprovação
- **Recibo**: quando a OS é concluída
- **Relatório semanal**: toda segunda-feira para o email do dono
- **Boas-vindas fornecedor**: quando um fornecedor é cadastrado

## Planos Resend
- Free: 3.000 emails/mês — suficiente para 100+ oficinas
- Pro: US$ 20/mês para 50.000 emails
