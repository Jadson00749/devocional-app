// Script para gerar VAPID keys para notificações push
// Execute: node scripts/generate-vapid-keys.js

const crypto = require('crypto');

function generateVAPIDKeys() {
  const curve = crypto.createECDH('prime256v1');
  curve.generateKeys();

  const publicKey = curve.getPublicKey('base64');
  const privateKey = curve.getPrivateKey('base64');

  // Converter para formato URL-safe base64 (usado pelo Web Push)
  const publicKeyBase64 = Buffer.from(publicKey, 'base64').toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  
  const privateKeyBase64 = Buffer.from(privateKey, 'base64').toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  return {
    publicKey: publicKeyBase64,
    privateKey: privateKeyBase64
  };
}

// Gerar as chaves
const keys = generateVAPIDKeys();

console.log('\n🔑 VAPID Keys Geradas!\n');
console.log('═══════════════════════════════════════════════════════════');
console.log('\n📋 PUBLIC KEY (use no frontend):');
console.log(keys.publicKey);
console.log('\n🔒 PRIVATE KEY (use no Supabase Secrets):');
console.log(keys.privateKey);
console.log('\n═══════════════════════════════════════════════════════════');
console.log('\n📝 Próximos passos:');
console.log('1. Copie a PUBLIC KEY e cole em: src/services/pushNotificationService.ts');
console.log('2. Copie a PRIVATE KEY e adicione como secret no Supabase:');
console.log('   - Settings > Edge Functions > Secrets');
console.log('   - Nome: VAPID_PRIVATE_KEY');
console.log('   - Valor: (cole a private key aqui)');
console.log('\n⚠️  IMPORTANTE: Mantenha essas chaves seguras!');
console.log('═══════════════════════════════════════════════════════════\n');


