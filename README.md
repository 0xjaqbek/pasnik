# Paśnik

Aplikacja PWA do zarządzania produktami spożywczymi, planowania posiłków i redukcji marnowania jedzenia.

## Co robi aplikacja

- **Spiżarnia** — śledzenie produktów w lodówce, spiżarni i zamrażarce z datami ważności
- **Przepisy** — baza własnych przepisów + generowanie nowych przez AI z dostępnych produktów
- **Kalendarz posiłków** — planowanie posiłków na tydzień (śniadanie, II śniadanie, obiad, kolacja, przekąska) + luźne pomysły
- **Lista zakupów** — automatyczne generowanie z zaplanowanych posiłków lub ręczne dodawanie, z możliwością przeniesienia kupionych produktów do spiżarni
- **Powiadomienia push** — codzienne alerty o przeterminowanych produktach, brakujących składnikach i zaplanowanych posiłkach

## Stack technologiczny

- **Next.js 16** (App Router)
- **tRPC v11** (type-safe API)
- **Prisma 7** (ORM, PostgreSQL)
- **Tailwind CSS** (styling)
- **PWA** (instalacja na telefonie, push notifications)
- **DeepSeek / OpenAI API** (generowanie przepisów)

## Instalacja lokalna

### Wymagania

- Node.js 20+
- PostgreSQL (lokalnie lub Neon)
- npm

### Kroki

```bash
# 1. Sklonuj repo
git clone https://github.com/0xjaqbek/pasnik.git
cd pasnik

# 2. Zainstaluj zależności
npm install

# 3. Skopiuj plik env i uzupełnij wartości (opis poniżej)
cp .env.example .env

# 4. Wygeneruj klienta Prisma
npx prisma generate

# 5. Uruchom migrację bazy danych
npx prisma migrate dev --name init

# 6. Uruchom serwer deweloperski
npm run dev
```

Aplikacja będzie dostępna na `http://localhost:3000`.

### Tworzenie użytkownika

Rejestracja jest dostępna w UI (`/register`), ale możesz też utworzyć użytkownika skryptem:

```bash
npx tsx scripts/create-user.ts email@example.com Haslo123! Imie
```

## Zmienne środowiskowe (.env)

### DATABASE_URL

Connection string do PostgreSQL.

**Lokalny Postgres:**
```
DATABASE_URL="postgresql://user:password@localhost:5432/pasnik?schema=public"
```

**Neon (darmowy, chmurowy):**
1. Zarejestruj się na [neon.tech](https://neon.tech)
2. Utwórz nowy projekt
3. Skopiuj connection string z Dashboard → Connection Details
```
DATABASE_URL="postgresql://neondb_owner:haslo@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"
```

### JWT_SECRET

Losowy string do podpisywania tokenów JWT. Wygeneruj:

```bash
openssl rand -hex 32
```

### OPENAI_API_KEY

Klucz API do generowania przepisów przez AI. Obsługiwani dostawcy:

**OpenAI:**
1. Wejdź na [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Utwórz nowy klucz (zaczyna się od `sk-`)
3. Aplikacja automatycznie użyje modelu `gpt-4o-mini`

**DeepSeek:**
1. Wejdź na [platform.deepseek.com/api_keys](https://platform.deepseek.com/api_keys)
2. Utwórz nowy klucz
3. Aplikacja automatycznie rozpoznaje klucz DeepSeek (nie zaczyna się od `sk-`) i użyje modelu `deepseek-chat`

Rozpoznawanie dostawcy dzieje się automatycznie na podstawie prefiksu klucza — wystarczy wkleić klucz w `OPENAI_API_KEY`.

### VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY / NEXT_PUBLIC_VAPID_PUBLIC_KEY

Klucze do Web Push notifications. Wygeneruj parę:

```bash
npx web-push generate-vapid-keys
```

Otrzymasz `Public Key` i `Private Key`. Ustaw:
```
VAPID_PUBLIC_KEY=<public key>
VAPID_PRIVATE_KEY=<private key>
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<public key>
```

`NEXT_PUBLIC_VAPID_PUBLIC_KEY` to ta sama wartość co `VAPID_PUBLIC_KEY` — prefix `NEXT_PUBLIC_` udostępnia ją w przeglądarce (wymagany do subskrypcji push).

### CRON_SECRET

Losowy string zabezpieczający endpoint powiadomień cron. Wygeneruj:

```bash
openssl rand -hex 32
```

Vercel automatycznie wysyła ten secret w nagłówku przy wywołaniu crona.

### DISABLE_REGISTRATION / NEXT_PUBLIC_DISABLE_REGISTRATION

Wyłączanie rejestracji nowych użytkowników — szczegóły w sekcji poniżej.

## Deploy na Vercel

1. Połącz repo z [vercel.com](https://vercel.com) (Import Git Repository)
2. Dodaj **wszystkie** zmienne środowiskowe w Settings → Environment Variables (scope: **Production**)
3. Deploy — Vercel automatycznie zbuduje i uruchomi aplikację

### Powiadomienia push (cron)

Plik `vercel.json` konfiguruje codzienne wywołanie o 7:00 UTC:

```json
{
  "crons": [{
    "path": "/api/cron/notifications",
    "schedule": "0 7 * * *"
  }]
}
```

Żeby powiadomienia działały:
1. Ustaw `CRON_SECRET` w Vercel env vars
2. Ustaw klucze VAPID w Vercel env vars
3. Użytkownik musi włączyć powiadomienia push w aplikacji (Ustawienia → Powiadomienia push → Włącz)

## Wyłączenie rejestracji po deployu

Jeśli chcesz żeby nikt inny nie mógł się zarejestrować i korzystać z Twoich kluczy API, ustaw w Vercel → Settings → Environment Variables:

```
DISABLE_REGISTRATION=true
NEXT_PUBLIC_DISABLE_REGISTRATION=true
```

**Obie zmienne są wymagane:**
- `DISABLE_REGISTRATION` — blokuje endpoint rejestracji na serwerze (zwraca błąd 403)
- `NEXT_PUBLIC_DISABLE_REGISTRATION` — ukrywa formularz rejestracji i link "Zarejestruj się" w UI

Po ustawieniu zmiennych **zrób redeploy** (Vercel → Deployments → Redeploy) — zmienne `NEXT_PUBLIC_*` są wbudowywane w kod podczas budowania.

W repozytorium rejestracja pozostaje w pełni funkcjonalna — te zmienne nie są ustawione w `.env.example`.

Nowych użytkowników możesz nadal tworzyć ręcznie:

```bash
npx tsx scripts/create-user.ts email@example.com Haslo123! Imie
```

## Zmiana dostawcy AI

Aplikacja automatycznie rozpoznaje dostawcę na podstawie klucza API:

| Klucz zaczyna się od | Dostawca | Model |
|---|---|---|
| `sk-` | OpenAI | gpt-4o-mini |
| cokolwiek innego | DeepSeek | deepseek-chat |

Żeby zmienić dostawcę, zamień wartość `OPENAI_API_KEY` na klucz od innego dostawcy. Nie trzeba zmieniać kodu.

Logika rozpoznawania znajduje się w `src/lib/ai.ts`.

## Struktura projektu

```
src/
├── app/
│   ├── (app)/              # Strony aplikacji (wymagają logowania)
│   │   ├── page.tsx        # Spiżarnia (strona główna)
│   │   ├── przepisy/       # Przepisy, generowanie AI
│   │   ├── kalendarz/      # Kalendarz posiłków
│   │   ├── zakupy/         # Lista zakupów
│   │   └── ustawienia/     # Ustawienia
│   ├── (auth)/             # Login / Rejestracja
│   └── api/
│       ├── trpc/           # tRPC endpoint
│       └── cron/           # Cron powiadomień
├── components/             # Komponenty React
├── lib/                    # Utilities (auth, prisma, trpc, ai, push)
├── server/
│   ├── routers/            # tRPC routery
│   ├── trpc.ts             # Inicjalizacja tRPC
│   └── context.ts          # Kontekst tRPC
prisma/
├── schema.prisma           # Model danych
└── migrations/             # Migracje bazy
scripts/
└── create-user.ts          # Skrypt do tworzenia użytkowników
```

## Licencja

MIT
