// Script para gerar VAPID keys para notificações push
// Execute: node scripts/generate-vapid-keys.mjs

import crypto from 'crypto';

// Função para gerar VAPID keys usando crypto nativo do Node.js
function generateVAPIDKeys() {
  // Criar curva elíptica P-256
  const curve = crypto.createECDH('prime256v1');
  curve.generateKeys();

  // Obter chaves em formato Buffer
  const publicKey = curve.getPublicKey();
  const privateKey = curve.getPrivateKey();

  // Converter para base64 URL-safe (formato usado pelo Web Push)
  const publicKeyBase64 = publicKey.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  
  const privateKeyBase64 = privateKey.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  return {
    publicKey: publicKeyBase64,
    privateKey: privateKeyBase64
  };
}

// Gerar as chaves
const vapidKeys = generateVAPIDKeys();

console.log('\n🔑 VAPID Keys Geradas!\n');
console.log('═══════════════════════════════════════════════════════════');
console.log('\n📋 PUBLIC KEY (use no frontend):');
console.log(vapidKeys.publicKey);
console.log('\n🔒 PRIVATE KEY (use no Supabase Secrets):');
console.log(vapidKeys.privateKey);
console.log('\n═══════════════════════════════════════════════════════════');
console.log('\n📝 Próximos passos:');
console.log('1. Copie a PUBLIC KEY e cole em: src/services/pushNotificationService.ts');
console.log('   (substitua a constante VAPID_PUBLIC_KEY)');
console.log('\n2. Copie a PRIVATE KEY e adicione como secret no Supabase:');
console.log('   - Settings > Edge Functions > Secrets');
console.log('   - Nome: VAPID_PRIVATE_KEY');
console.log('   - Valor: (cole a private key aqui)');
console.log('\n⚠️  IMPORTANTE: Mantenha essas chaves seguras!');
console.log('═══════════════════════════════════════════════════════════\n');

