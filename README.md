### **Specyfikacja Funkcjonalna Aplikacji: Katalog Sprawców i Zdarzeń**

**1.1. Cel i Ogólny Opis**

Aplikacja "Katalog Sprawców i Zdarzeń" to samodzielne narzędzie typu PWA (Progressive Web App), które można zainstalować na urządzeniu mobilnym. Jest przeznaczona dla mobilnych pracowników ochrony. Działa w pełni offline, zapisując wszystkie dane, w tym zdjęcia, lokalnie w przeglądarce (IndexedDB). Jej celem jest tworzenie, zarządzanie i przeszukiwanie bazy danych sprawców oraz powiązanych z nimi zdarzeń (np. kradzieży).

**1.2. Główne Widoki**

Aplikacja składa się z dwóch głównych zakładek:
*   **Katalog:** Główny widok służący do przeglądania, wyszukiwania i filtrowania bazy sprawców.
*   **Dodaj:** Formularz służący do dodawania nowych sprawców i opcjonalnie pierwszego zdarzenia.

**1.3. Funkcjonalności Widoku "Katalog"**

*   **Lista Sprawców:** Wyświetla wszystkich sprawców w bazie w formie kart. Każda karta zawiera:
    *   Miniaturę pierwszego zdjęcia sprawcy.
    *   Pseudonim (jeśli został podany).
    *   Podsumowanie kluczowych cech wyglądu (np. "Kobieta, 28-35 lat, Blond").
    *   Listę unikalnych numerów sklepów, w których odnotowano zdarzenia z udziałem sprawcy.
*   **Wyszukiwanie Frazą:** Pole tekstowe pozwala na dynamiczne przeszukiwanie całej bazy danych (danych sprawców oraz wszystkich powiązanych z nimi zdarzeń) pod kątem wprowadzonej frazy.
*   **Filtrowanie Zaawansowane:**
    *   Przycisk "Filtry" otwiera modal z opcjami filtrowania.
    *   Filtry oparte są na cechach sprawców (płeć, kolor włosów, zarost itp.), zakresie wieku oraz numerze sklepu.
    *   **Filtry cech:** Możliwe jest zaznaczenie wielu opcji w jednej kategorii (działa jak LUB, np. włosy blond LUB rude). Zaznaczenie opcji w różnych kategoriach zawęża wyniki (działa jak I, np. Kobieta I włosy blond). Dla każdej kategorii dostępna jest opcja "Nieokreślone", która znajduje profile z nieuzupełnioną daną cechą.
    *   **Filtr wieku:** Pola "Od" i "Do" pozwalają wyszukać sprawców, których zdefiniowany przedział wiekowy pokrywa się z zakresem podanym przez użytkownika.
    *   **Filtr sklepów:** Dynamicznie generowana lista unikalnych numerów sklepów z bazy, pozwalająca na wielokrotny wybór.
    *   Przycisk "Filtry" wyświetla liczbę aktywnych filtrów.

**1.4. Funkcjonalności Widoku "Dodaj"**

*   **Formularz Dodawania Sprawcy:**
    *   **Zdjęcia:** Pole do dodania jednego lub więcej zdjęć (minimum jedno jest wymagane).
    *   **Pola Domyślne:** Pola "Wiek" (w formie zakresu "od-do"), "Płeć" oraz "Kolor włosów" są widoczne od razu.
    *   **Pola Dynamiczne:** Przycisk `+ Dodaj pole do profilu` otwiera menu, z którego można wybrać i dodać do formularza opcjonalne pola (Pseudonim, Zarost, Tatuaże itp.).
*   **Formularz Dodawania Zdarzenia (Opcjonalny):**
    *   Sekcja jest opcjonalna. Jeśli pole "Numer Amodit" pozostanie puste, zostanie dodany tylko profil sprawcy.
    *   **Pola podstawowe:** Numer Amodit (unikalny identyfikator), rodzaj zdarzenia, numer sklepu, data.
    *   **Pola Dynamiczne:** Przycisk `+ Dodaj pole do zdarzenia` pozwala dodać opcjonalne pola, w tym:
        *   **Typ kradzieży:** Pole wielokrotnego wyboru (np. "biegacz", "perfumy", "KSO"). Wybranie opcji "inne" aktywuje dodatkowe pole tekstowe do własnego opisu.
        *   **Kwota, Opis.**

**1.5. Karta Szczegółów Sprawcy (Modal)**

Otwierana po kliknięciu na kartę sprawcy w widoku "Katalog".
*   **Nagłówek:** Wyświetla pseudonim lub ID sprawcy oraz ikonę edycji (✏️) i przycisk zamknięcia (X).
*   **Galeria Zdjęć:** Wyświetla wszystkie zdjęcia sprawcy. Kliknięcie na zdjęcie powiększa je na pełny ekran.
*   **Dane Sprawcy:** Wyświetla wszystkie wprowadzone dane profilowe, w tym zakres wieku.
*   **Statystyki:** Automatycznie obliczone i wyświetlone dane:
    *   Data ostatniego ujęcia.
    *   Suma kwot kradzieży (całkowita).
    *   Suma kwot kradzieży od ostatniego ujęcia.
    *   Lista unikalnych numerów sklepów, w których sprawca był widziany.
*   **Historia Zdarzeń:** Lista wszystkich zdarzeń powiązanych z danym sprawcą, posortowana od najnowszego. Wyświetla również "Typ kradzieży".
*   **Dostępne Akcje:**
    *   **Edycja Sprawcy (✏️ w nagłówku):** Otwiera formularz edycji danych profilowych, który pozwala również na zarządzanie zdjęciami (usuwanie istniejących i dodawanie nowych).
    *   **Edycja Zdarzenia (✏️ przy zdarzeniu):** Otwiera formularz edycji tego konkretnego zdarzenia.
    *   **Dodaj/Przypisz zdarzenie:** Otwiera modal z dwiema opcjami: dodania zupełnie nowego zdarzenia do tego sprawcy lub przypisania istniejącego zdarzenia (po numerze Amodit).
    *   **Usuń Sprawcę:** Po potwierdzeniu, usuwa profil sprawcy oraz wszystkie powiązane z nim zdarzenia.

**1.6. Ustawienia (Ikona Zębatki)**

Otwiera modal z informacjami o twórcy oraz zaawansowanymi opcjami zarządzania danymi.
*   **Eksport Danych:** Przycisk generuje i pobiera plik `.json` zawierający pełną kopię zapasową lokalnej bazy danych (wraz ze zdjęciami).
*   **Import Danych:** Sekcja z trzema oddzielnymi opcjami importu danych z pliku `.json`:
    *   **Połącz (dodaj brakujące):** Dodaje do lokalnej bazy tylko te zdarzenia (na podstawie unikalnego `Numeru Amodit`), których jeszcze nie ma, wraz z powiązanymi z nimi nowymi sprawcami. Istniejące dane pozostają nienaruszone.
    *   **Dodaj wszystko jako nowe:** Dodaje wszystkich sprawców z pliku jako nowe wpisy oraz wszystkie zdarzenia, których `Numer Amodit` nie koliduje z istniejącymi.
    *   **Zastąp (wymaż i wgraj):** Całkowicie usuwa lokalną bazę danych i zastępuje ją danymi z pliku.
*   **Wyczyść całą bazę:** Przycisk pozwala na całkowite usunięcie wszystkich danych z bazy po potwierdzeniu.

**1.7. Technologia**

*   Aplikacja jest pojedynczym plikiem HTML, który można zainstalować na urządzeniu mobilnym jako **Progressive Web App (PWA)**.
*   Instalacja i działanie offline są wspierane przez pliki **`manifest.json`** oraz **`sw.js` (Service Worker)**, który buforuje "skorupę" aplikacji.
*   Interfejs użytkownika jest zarządzany przez framework **Vue.js**.
*   Wszystkie dane są przechowywane lokalnie w przeglądarce za pomocą **IndexedDB**, z wykorzystaniem biblioteki **Dexie.js** jako uproszczonego interfejsu.

---

### **Możliwe Kierunki Rozwoju**

**1. Automatyczne Wypełnianie Danych ze Zdjęć (OCR)**
*   **Opis:** Zaimplementowanie funkcji Optycznego Rozpoznawania Znaków (OCR) przy użyciu biblioteki takiej jak Tesseract.js. Po wgraniu zdjęcia w widoku "Dodaj", aplikacja automatycznie "przeczytałaby" tekst z obrazu i spróbowała wypełnić pola formularza, takie jak "Numer Amodit", "Numer sklepu" i "Data".
*   **Korzyści:** Drastyczne przyspieszenie procesu dodawania nowych zdarzeń i zmniejszenie liczby błędów przy ręcznym wpisywaniu danych.
*   **Wyzwania:** Zależność od jakości zdjęć, wydajność na słabszych urządzeniach mobilnych, konieczność weryfikacji danych przez użytkownika.

**2. Zaawansowany, Selektywny Import Danych**
*   **Opis:** Rozbudowa funkcji importu o interaktywny interfejs. Po wybraniu pliku do importu, aplikacja wyświetlałaby nowe okno z listą wszystkich sprawców i zdarzeń z pliku. Użytkownik mógłby za pomocą checkboxów wybrać, które konkretnie rekordy chce dodać do swojej lokalnej bazy. Aplikacja dodatkowo oznaczałaby zdarzenia, które już istnieją w bazie.
*   **Korzyści:** Daje użytkownikowi pełną, granularną kontrolę nad procesem łączenia baz danych.
*   **Wyzwania:** Znaczna złożoność implementacji, wymagająca stworzenia nowego interfejsu i skomplikowanej logiki do zarządzania stanem tymczasowym.