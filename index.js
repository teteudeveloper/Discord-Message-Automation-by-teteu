const { Client } = require('discord.js-selfbot-v13');
const fs = require('fs');
const readline = require('readline');

const messageInterval = 1000; 
const groupSize = 5; 
const retryDelay = 1000; 
const groupDelay = 1000; 
const targetUserId = ''; // ID do usuário a mencionar

const tokens = fs.readFileSync('token.txt', 'utf-8')
    .split('\n')
    .map(line => line.trim())
    .filter(line => line);

if (tokens.length === 0) {
    console.error('Nenhum token encontrado no arquivo token.txt! Certifique-se de adicionar tokens, um por linha.');
    process.exit(1);
}

const messages = fs.readFileSync('emete.txt', 'utf-8')
    .split('\n')
    .map(line => line.trim())
    .filter(line => line);

if (messages.length === 0) {
    console.error('Nenhuma mensagem encontrada no arquivo emete.txt! Certifique-se de adicionar mensagens, uma por linha.');
    process.exit(1);
}

const tokenGroups = [];
for (let i = 0; i < tokens.length; i += groupSize) {
    tokenGroups.push(tokens.slice(i, i + groupSize));
}

console.log('Por favor, insira o ID do canal onde as mensagens serão enviadas:');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

rl.question('ID do canal: ', (channelId) => {
    if (!channelId) {
        console.error('ID do canal não fornecido.');
        rl.close();
        process.exit(1);
    }

    rl.close();

    tokenGroups.forEach((group, groupIndex) => {
        setTimeout(() => {
            group.forEach((token, tokenIndex) => {
                setTimeout(() => {
                    const client = new Client();

                    client.on('ready', async () => {
                        console.log(`Bot logado: ${client.user.username} (Token: ${token}).`);

                        try {
                            const channel = await client.channels.fetch(channelId);
                            if (!channel) {
                                console.error(`Canal não encontrado para o token: ${token}`);
                                return;
                            }

                            console.log(`Monitorando o canal: ${channelId}.`);

                            let messageIndex = 0;

                            const messageSender = setInterval(() => {
                                if (messages.length === 0) {
                                    console.error('Nenhuma mensagem disponível para enviar.');
                                    clearInterval(messageSender);
                                    return;
                                }

                                const messageContent = `${messages[messageIndex]} <@${targetUserId}>`;

                                channel.send(messageContent)
                                    .then(() => console.log(`Mensagem enviada: ${messageContent}`))
                                    .catch(err => console.error(`Erro ao enviar mensagem: ${err}`));

                                messageIndex = (messageIndex + 1) % messages.length;
                            }, messageInterval);
                        } catch (error) {
                            console.error(`Erro ao configurar o bot com o token: ${token}`, error);
                        }
                    });

                    client.login(token).catch(err => {
                        console.error(`Erro ao logar com o token ${token}:`, err);
                    });
                }, tokenIndex * retryDelay); 
            });
        }, groupIndex * groupDelay); 
    });
});
