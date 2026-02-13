# Paśnik — Dokument Projektowy

## Wizja

Aplikacja mobilna (PWA) do zarządzania produktami spożywczymi w gospodarstwie domowym. Pomaga śledzić zawartość spiżarni/lodówki, planować posiłki, redukować marnowanie jedzenia i racjonalizować zakupy.

## Wymagania

### Użytkownicy
- Jednoosobowa na start, architektura gotowa na współdzielenie (wielu domowników) w przyszłości
- Autentykacja: email + hasło

### Kluczowe funkcje
1. **Zarządzanie produktami** — dodawanie (formularz), edycja, usuwanie produktów z lokalizacjami (lodówka/spiżarnia/zamrażarka), kategoriami i datami ważności
2. **Przepisy** — baza własnych przepisów + generowanie AI (hybryda: najpierw baza, potem AI)
3. **Planowanie posiłków** — kalendarz tygodniowy (Śniadanie, II Śniadanie, Obiad, Kolacja, Przekąska) + luźna lista propozycji
4. **Lista zakupów** — automatycznie generowana z brakujących składników + ręczne dodawanie
5. **Powiadomienia push** — przeterminowane produkty, brakujące składniki, przypomnienia o posiłkach
6. **Dodawanie produktów** — ręczny formularz (OCR jako potencjalne rozszerzenie w przyszłości)

### UI
- Minimalistyczny/czysty design
- Język: polski
- Nawigacja dolna (bottom tabs)

---

## Stack technologiczny

| Warstwa | Technologia |
|---|---|
| Framework | Next.js 14+ (App Router) |
| API | tRPC (end-to-end typesafe) |
| ORM | Prisma |
| Baza danych | PostgreSQL (Neon — serverless) |
| Styling | Tailwind CSS |
| PWA | next-pwa (service worker, push) |
| AI | DeepSeek / OpenAI API |
| Hosting | Vercel |
| Język | TypeScript |

---

## Model danych

### User
- id, email, passwordHash, name, createdAt

### Product (produkt w spiżarni/lodówce)
- id, userId (FK → User)
- name (np. "Mleko 3.2%")
- category (enum: NABIAŁ, MIĘSO, WARZYWA, OWOCE, PIECZYWO, SUCHE, MROŻONKI, NAPOJE, INNE)
- location (enum: LODÓWKA, SPIŻARNIA, ZAMRAŻARKA)
- quantity, unit (enum: SZT, KG, G, L, ML)
- expiryDate
- addedAt
- note (opcjonalne)

### Recipe (przepis)
- id, userId (FK → User)
- name, description
- instructions (tekst — sposób przygotowania)
- servings (liczba porcji)
- prepTime, cookTime (minuty)
- source (enum: USER, AI_GENERATED)
- createdAt

### RecipeIngredient (składnik przepisu)
- id, recipeId (FK → Recipe)
- name, quantity, unit
- optional (bool — czy można pominąć)

### MealPlan (zaplanowany posiłek w kalendarzu)
- id, userId (FK → User)
- date
- mealType (enum: ŚNIADANIE, DRUGIE_ŚNIADANIE, OBIAD, KOLACJA, PRZEKĄSKA)
- recipeId (FK → Recipe)
- notes

### MealIdea (luźna propozycja — lista "do zrobienia")
- id, userId (FK → User)
- recipeId (FK → Recipe)
- priority (enum: LOW, MEDIUM, HIGH)
- addedAt

### ShoppingListItem (element listy zakupów)
- id, userId (FK → User)
- name, quantity, unit
- category
- checked (bool)
- source (enum: AUTO_GENERATED, MANUAL)
- mealPlanId (opcjonalne FK → MealPlan)

---

## Architektura

```
┌─────────────────────────────────────────┐
│              PWA (Next.js)              │
│  ┌─────────────┐  ┌──────────────────┐  │
│  │ React UI    │  │ Service Worker   │  │
│  │ (Tailwind)  │  │ (push, cache)    │  │
│  └──────┬──────┘  └────────┬─────────┘  │
│         │                  │            │
│  ┌──────┴──────────────────┴─────────┐  │
│  │         tRPC Client               │  │
│  └──────────────┬────────────────────┘  │
├─────────────────┼───────────────────────┤
│  ┌──────────────┴────────────────────┐  │
│  │         tRPC Router               │  │
│  │  ├── product.*                    │  │
│  │  ├── recipe.*                     │  │
│  │  ├── mealPlan.*                   │  │
│  │  ├── shoppingList.*               │  │
│  │  └── notification.*               │  │
│  └──────────────┬────────────────────┘  │
│  ┌──────────────┴──────┐ ┌───────────┐  │
│  │   Prisma ORM        │ │ AI Service│  │
│  │   (PostgreSQL)      │ │(DeepSeek/ │  │
│  └─────────────────────┘ │ OpenAI)   │  │
│                          └───────────┘  │
└─────────────────────────────────────────┘
         │                      │
    ┌────┴─────┐         ┌──────┴──────┐
    │ Neon DB  │         │ DeepSeek/   │
    │(Postgres)│         │ OpenAI API  │
    └──────────┘         └─────────────┘
```

### tRPC Routery
- `product.*` — CRUD produktów, filtrowanie, wyszukiwanie
- `recipe.*` — CRUD przepisów, dopasowanie do produktów, generowanie AI
- `mealPlan.*` — CRUD planów, kalendarz tygodniowy, luźne pomysły
- `shoppingList.*` — generowanie listy, CRUD pozycji, przenoszenie do spiżarni
- `notification.*` — konfiguracja, subskrypcje push

---

## Widoki UI

### Nawigacja dolna
```
[Spiżarnia] [Przepisy] [Kalendarz] [Zakupy] [Ustawienia]
```

### Spiżarnia (ekran główny)
- Lista produktów pogrupowana wg lokalizacji (Lodówka / Spiżarnia / Zamrażarka)
- Kolorowe oznaczenia dat ważności (zielony > 5 dni, żółty 2-5 dni, czerwony < 2 dni, czarny = przeterminowany)
- Przycisk "+" do dodawania produktu
- Swipe do usuwania / edycji
- Wyszukiwarka + filtrowanie po kategorii

### Przepisy
- Lista własnych przepisów z wyszukiwarką
- Przycisk "Generuj przepis z tego co mam" → AI z listą aktualnych produktów
- Zawsze dostępna opcja "Wygeneruj inny przepis przez AI" niezależnie od dopasowań z bazy
- Szczegóły przepisu: składniki (oznaczenie co masz / czego brak), instrukcje, czas
- Dodawanie własnych przepisów

### Kalendarz
- Widok tygodniowy, dni z posiłkami (Śniadanie, II Śniadanie, Obiad, Kolacja, Przekąska)
- Edycja / przeciąganie posiłków
- Sekcja "Pomysły" — luźna lista propozycji do przeciągnięcia na kalendarz
- Przycisk "Generuj listę zakupów" z wybranego zakresu dat

### Zakupy
- Lista pogrupowana wg kategorii
- Checkbox do odhaczania
- Widoczne źródło (z jakiego przepisu/planu lub ręczne)
- Przycisk "Dodaj do spiżarni" — odchaczone → formularz z pre-wypełnionymi danymi

### Ustawienia
- Profil użytkownika
- Konfiguracja powiadomień (typy, godzina, ile dni przed wygaśnięciem)
- Klucz API (DeepSeek/OpenAI)
- Domyślne wartości

---

## Powiadomienia push

### Mechanizm
- Vercel Cron Job — codziennie rano (konfigurowalna godzina)
- Web Push API via service worker

### Typy

| Powiadomienie | Wyzwalacz | Przykład |
|---|---|---|
| Zbliżający się termin ważności | X dni przed expiryDate (domyślnie 2) | "Mleko wygasa pojutrze!" |
| Przeterminowany produkt | expiryDate < dziś | "Jogurt grecki jest przeterminowany" |
| Brakujące składniki | Zaplanowany posiłek na jutro, brak składników | "Na jutrzejszy obiad (Lasagne) brakuje: mozzarella, mięso mielone" |
| Przypomnienie o posiłku | Rano danego dnia | "Dziś na obiad: Spaghetti Bolognese" |

### Konfiguracja
- Włącz/wyłącz każdy typ osobno
- Godzina wysyłki
- Ile dni przed wygaśnięciem alertować

---

## Generowanie przepisów (AI)

### Flow
1. Użytkownik klika "Generuj przepis z tego co mam"
2. Opcjonalnie wybiera preferencje: typ posiłku, kuchnia, czas przygotowania
3. System pobiera listę aktualnych produktów z bazy
4. **Najpierw** przeszukuje bazę przepisów użytkownika — dopasowuje ≥80% składników
5. Wyświetla dopasowania z bazy + **zawsze** przycisk "Wygeneruj inny przepis przez AI"
6. Jeśli AI — wysyła prompt do DeepSeek/OpenAI z listą produktów
7. AI zwraca przepis w JSON (name, description, ingredients[], instructions, prepTime, cookTime, servings)
8. Użytkownik może zapisać wygenerowany przepis do swojej bazy

### Zabezpieczenia
- Klucz API szyfrowany w DB
- Rate limiting
- Fallback: jeśli API niedostępne, pokaż tylko dopasowania z bazy

---

## Lista zakupów — logika

### Automatyczne generowanie
1. Użytkownik wybiera zakres dat w kalendarzu
2. System zbiera RecipeIngredient z zaplanowanych posiłków
3. Porównuje ze stanem spiżarni/lodówki
4. Brakujące → lista zakupów (AUTO_GENERATED)
5. Agregacja duplikatów (sumowanie ilości)

### Po zakupach
- Odhaczone produkty → "Dodaj do spiżarni"
- Pre-wypełniony formularz (nazwa, ilość), użytkownik dodaje datę ważności i lokalizację
- Po dodaniu produkt znika z listy zakupów

---

## Decyzje projektowe
- Jednoosobowa na start, model danych z userId gotowy na wielu użytkowników
- Polski UI bez i18n (uproszczenie)
- Ręczne dodawanie produktów (OCR w przyszłości)
- Hybryda: baza przepisów + AI fallback, ale AI zawsze dostępne na żądanie
- Minimalistyczny UI z Tailwind CSS
