# Documentation Hub

Asistente inteligente para documentación empresarial. Sube los documentos de tu empresa y pregunta lo que necesites — la IA busca en tu documentación y te responde en segundos.

## Arquitectura

- **Frontend**: Next.js 15 + Tailwind CSS (desplegado en Vercel)
- **LLM**: Claude Sonnet (vía Anthropic API)
- **Vector DB**: Pinecone (búsqueda semántica de documentos)
- **Auth + DB**: Supabase (autenticación + metadatos de documentos)
- **Embeddings**: Pinecone Inference API (multilingual-e5-large, gratis)

## Guía de instalación paso a paso

### 1. Crear cuenta en Pinecone

1. Ve a [pinecone.io](https://www.pinecone.io/) y crea una cuenta (Google o email)
2. Una vez dentro, haz clic en **"Create Index"** (o "Create your first index")
3. Configura el índice:
   - **Index name**: `documentation-hub`
   - **Dimensions**: `1024`
   - **Metric**: `cosine`
   - **Cloud**: Cualquiera (elige el que ofrezca gratis, normalmente AWS us-east-1)
   - **Spec type**: Serverless
4. Haz clic en **Create Index**
5. Ve a **API Keys** en el menú lateral y copia tu API key

### 2. Crear cuenta en Supabase

1. Ve a [supabase.com](https://supabase.com/) y crea una cuenta
2. Haz clic en **"New Project"**
   - **Name**: `documentation-hub` (o lo que quieras)
   - **Database password**: Pon una contraseña segura (guárdala)
   - **Region**: Elige la más cercana (EU West si estás en España)
3. Espera a que se cree el proyecto (~2 minutos)
4. Ve a **Settings → API** y apunta:
   - **Project URL** (algo como `https://xxxxx.supabase.co`)
   - **anon public key** (la clave pública)
   - **service_role key** (la clave secreta — NO la compartas nunca)
5. Ve a **SQL Editor** (menú lateral) y haz clic en **"New query"**
6. Copia todo el contenido del archivo `supabase-setup.sql` y ejecútalo
7. Ve a **Authentication → Settings → Email Auth** y asegúrate de que:
   - "Enable Email Signup" está activado
   - (Opcional) Desactiva "Confirm email" si quieres probar rápido sin verificar emails

### 3. Tener API Key de Anthropic

1. Ve a [console.anthropic.com](https://console.anthropic.com/)
2. Ve a **API Keys** y crea una nueva (o usa la que ya tengas)
3. Debe empezar por `sk-ant-`

### 4. Desplegar en Vercel

#### Opción A: Desde GitHub (recomendado)

1. Sube este proyecto a un repositorio en GitHub
2. Ve a [vercel.com](https://vercel.com/) e importa el repositorio
3. En la configuración del proyecto, añade las **Environment Variables**:

| Variable | Valor |
|----------|-------|
| `ANTHROPIC_API_KEY` | Tu clave de Anthropic (`sk-ant-...`) |
| `PINECONE_API_KEY` | Tu clave de Pinecone |
| `PINECONE_INDEX` | `documentation-hub` |
| `NEXT_PUBLIC_SUPABASE_URL` | Tu URL de Supabase (`https://xxx.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Tu anon key de Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Tu service role key de Supabase |

4. Haz clic en **Deploy**

#### Opción B: Desde CLI

```bash
npm install -g vercel
vercel login
vercel --prod
```

(Te pedirá las variables de entorno durante el setup)

### 5. Probar

1. Abre tu URL de Vercel (algo como `https://documentation-hub-xxxx.vercel.app`)
2. Regístrate con email y contraseña
3. Sube un documento de prueba (PDF, Word, TXT, Markdown...)
4. Espera a que se indexe (verás un mensaje de confirmación)
5. Haz una pregunta sobre el contenido del documento

## Desarrollo local

```bash
# Clonar e instalar
git clone <tu-repo>
cd documentation-hub
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Edita .env.local con tus credenciales

# Arrancar
npm run dev
```

Abre http://localhost:3000

## Estructura del proyecto

```
documentation-hub/
├── app/
│   ├── api/
│   │   ├── ask/route.ts          # Endpoint de preguntas (RAG)
│   │   ├── ingest/route.ts       # Endpoint de subida de documentos
│   │   └── documents/route.ts    # Listar/eliminar documentos
│   ├── chat/page.tsx             # Interfaz principal del chat
│   ├── login/page.tsx            # Página de login/registro
│   ├── layout.tsx                # Layout raíz
│   ├── page.tsx                  # Redirect a login o chat
│   └── globals.css               # Estilos globales
├── components/
│   ├── ChatMessage.tsx           # Componente de mensaje (con Markdown)
│   └── DocumentsSidebar.tsx      # Sidebar de gestión de documentos
├── lib/
│   ├── supabase.ts               # Cliente Supabase
│   ├── pinecone.ts               # Cliente Pinecone
│   ├── embeddings.ts             # Generación de embeddings
│   ├── chunking.ts               # Troceado de documentos
│   └── rag.ts                    # Motor RAG (buscar + preguntar a Claude)
├── supabase-setup.sql            # SQL para crear tablas en Supabase
├── vercel.json                   # Config de despliegue
└── .env.example                  # Plantilla de variables de entorno
```

## Formatos soportados

- **Texto**: .txt, .md, .csv, .json, .html
- **PDF**: .pdf (extracción de texto automática)
- **Word**: .docx (extracción de texto automática)

## Límites del tier gratuito

| Servicio | Límite gratis |
|----------|--------------|
| Pinecone | 2GB storage, 100K vectores |
| Supabase | 500MB DB, 50K auth users |
| Vercel | 100GB bandwidth/mes |
| Anthropic | Pago por uso (~$3/M tokens input con Sonnet) |

Para una empresa con ~500 documentos y uso moderado, el coste mensual estimado de la API de Anthropic sería de $5-20.
