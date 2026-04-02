const fs = require('fs');
const { execSync } = require('child_process');

try {
    const fullSchema = fs.readFileSync('prisma/schema.prisma', 'utf8');
    const datasource = fullSchema.split('model ')[0];
    
    // Test 1: Just User model
    const userModelMatch = fullSchema.match(/model User \{([\s\S]*?)\}/);
    if (userModelMatch) {
        const userSchema = datasource + 'model User {' + userModelMatch[1] + '}';
        fs.writeFileSync('prisma/test.prisma', userSchema);
        console.log('Testing User model only...');
        try {
            execSync('npx prisma validate --schema=prisma/test.prisma', { stdio: 'inherit' });
            console.log('User model is VALID');
        } catch (e) {
            console.log('User model is INVALID');
        }
    }

} catch (err) {
    console.error(err);
}
