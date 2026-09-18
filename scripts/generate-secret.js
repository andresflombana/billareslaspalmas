// Genera un secreto aleatorio nuevo para JWT_SECRET.
// Uso: npm run generate:secret
// (Solo imprime el valor — pégalo tú mismo en .env si quieres reemplazar el actual,
// o bien pide en el chat que se actualice el entregable con uno nuevo.)
const crypto = require('crypto');
console.log(crypto.randomBytes(48).toString('hex'));
