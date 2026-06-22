import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
// Garante que o dotenv seja carregado antes de qualquer verificação
dotenv.config();

// Verificação de variáveis de ambiente
if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_DATABASE) {
    console.error("Variáveis de ambiente encontradas:", {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        db: process.env.DB_DATABASE
    });
    throw new Error("Faltando variáveis críticas no arquivo .env para o banco de dados.");
}

class Database {
    private static instance: Database | null = null;
    private pool!: mysql.Pool;

    private constructor() {
        // O construtor privado impede instanciamento externo (regra do Singleton)
    }

    private createPool() {
        try {
            this.pool = mysql.createPool({
                host: process.env.DB_HOST,
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                database: process.env.DB_DATABASE,
                port: Number(process.env.DB_PORT), // Fallback para porta padrão
                waitForConnections: true,
                connectionLimit: 50,
                queueLimit: 0,
                timezone: 'Z',
                ssl: { rejectUnauthorized: false }
            });
            console.log("✅ Pool de conexão MySQL criado com sucesso.");
        } catch (error) {
            console.error("❌ Erro ao criar o pool de conexão:", error);
            throw error;
        }
    }

    public static getInstance(): Database {
        if (!Database.instance) {
            Database.instance = new Database();
            Database.instance.createPool();
        }
        return Database.instance;
    }

    public getPool(): mysql.Pool {
        return this.pool;
    }
}

// Exportamos a conexão pronta para uso
export const connection = Database.getInstance().getPool();

export async function initializeDatabase() {
    console.log("Inicializando o banco de dados e tabelas...");
    try {
        const tempConnection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
            ssl: { rejectUnauthorized: false }
        });


        const dbName = process.env.DB_DATABASE || 'api';


        await tempConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
        await tempConnection.query(`USE \`${dbName}\`;`);

        await tempConnection.query('DROP TABLE IF EXISTS itens_pedido;')
        await tempConnection.query('DROP TABLE IF EXISTS pedidos;')
        await tempConnection.query('DROP TABLE IF EXISTS produtos;')
        await tempConnection.query('DROP TABLE IF EXISTS categorias;')


        await tempConnection.query(`
           CREATE TABLE categorias (
                IdCategoria INT NOT NULL AUTO_INCREMENT,
                NomeCategoria VARCHAR(50) NOT NULL,
                DescricaoCategoria VARCHAR(255),
                DataCad DATETIME DEFAULT CURRENT_TIMESTAMP,
                DataMod TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (IdCategoria)
            );
        `);


        await tempConnection.query(`
           CREATE TABLE produtos (
                IdProduto INT NOT NULL AUTO_INCREMENT,
                FK_IdCategoria INT NOT NULL,
                NomeProduto VARCHAR(50) NOT NULL,
                DescricaoProduto VARCHAR(255),
                PrecoProduto DECIMAL(10,2) NOT NULL,
                QuantidadeEstoque INT NOT NULL,
                VinculoImagem VARCHAR(255),
                DataCad DATETIME DEFAULT CURRENT_TIMESTAMP,
                DataMod TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (IdProduto),
                FOREIGN KEY (FK_IdCategoria) REFERENCES categorias(IdCategoria)

            );
        `);
        await tempConnection.query(`
           CREATE TABLE pedidos (
                IdPedido INT NOT NULL AUTO_INCREMENT,
                StatusPedido ENUM('Pendente', 'Pago', 'Cancelado', 'Enviado'),
                ValorTotal DECIMAL(12,2) NOT NULL,
                DataCad DATETIME DEFAULT CURRENT_TIMESTAMP,
                DataMod TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (IdPedido)
            );
        `);
        await tempConnection.query(`
            CREATE TABLE itens_pedido (
                IdItem_Pedido INT NOT NULL AUTO_INCREMENT,
                FK_IdPedido INT NOT NULL,
                FK_IdProduto INT NOT NULL,
                Quantidade INT NOT NULL,
                Valor DECIMAL(10,2) NOT NULL,
                DataCad DATETIME DEFAULT CURRENT_TIMESTAMP,
                DataMod TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (IdItem_Pedido),
                FOREIGN KEY (FK_IdPedido) REFERENCES pedidos(IdPedido),
                FOREIGN KEY (FK_IdProduto) REFERENCES produtos(IdProduto)
            );
        `);


        await tempConnection.end();
        console.log("Banco de dados e tabelas verificados/criados com sucesso.");
    } catch (error) {
        console.error("Erro ao criar o banco ou as tabelas:", error);
        throw error;
    }
}