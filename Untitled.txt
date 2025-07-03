1. Specyfikacja Funkcjonalna Aplikacji: Katalog Sprawców i Zdarzeń
1.1. Cel i Ogólny Opis
Aplikacja "Katalog Sprawców i Zdarzeń" to samodzielne narzędzie (single-file web app) przeznaczone dla mobilnych pracowników ochrony. Działa w pełni offline, zapisując wszystkie dane, w tym zdjęcia, lokalnie w przeglądarce (IndexedDB). Jej celem jest tworzenie, zarządzanie i przeszukiwanie bazy danych sprawców oraz powiązanych z nimi zdarzeń (np. kradzieży).
1.2. Główne Widoki
Aplikacja składa się z dwóch głównych zakładek:
Katalog: Główny widok służący do przeglądania, wyszukiwania i filtrowania bazy sprawców.
Dodaj: Formularz służący do dodawania nowych sprawców i opcjonalnie pierwszego zdarzenia.
1.3. Funkcjonalności Widoku "Katalog"
Lista Sprawców: Wyświetla wszystkich sprawców w bazie w formie kart. Każda karta zawiera:
Miniaturę pierwszego zdjęcia sprawcy.
Pseudonim (jeśli został podany).
Podsumowanie kluczowych cech wyglądu (np. "Kobieta, 26-40, Blond").
Listę unikalnych numerów sklepów, w których odnotowano zdarzenia z udziałem sprawcy.
Wyszukiwanie Frazą: Pole tekstowe pozwala na dynamiczne przeszukiwanie całej bazy danych (dane sprawców i zdarzeń) pod kątem wprowadzonej frazy.
Filtrowanie Zaawansowane:
Przycisk "Filtry" otwiera modal z opcjami filtrowania.
Filtry oparte są na cechach sprawców (płeć, wiek, kolor włosów itp.).
Możliwe jest zaznaczenie wielu opcji w jednej kategorii (działa jak LUB, np. włosy blond LUB rude).
Zaznaczenie opcji w różnych kategoriach zawęża wyniki (działa jak I, np. Kobieta I włosy blond).
Przycisk "Filtry" wyświetla liczbę aktywnych filtrów.
Funkcje Pomocnicze:
Dodaj rekordy przykładowe: Przycisk widoczny tylko, gdy baza jest pusta. Dodaje kilka profili testowych.
Wyczyść całą bazę: Przycisk dostępny w menu Ustawień, pozwala na całkowite usunięcie wszystkich danych z bazy po potwierdzeniu.
1.4. Funkcjonalności Widoku "Dodaj"
Formularz Dodawania Sprawcy:
Zdjęcia: Pole do dodania jednego lub więcej zdjęć (minimum jedno jest wymagane).
Pola Dynamiczne: Przycisk + Dodaj pole do profilu otwiera menu, z którego można wybrać i dodać do formularza opcjonalne pola (Pseudonim, Płeć, Wiek, Tatuaże itp.).
Formularz Dodawania Zdarzenia (Opcjonalny):
Sekcja jest opcjonalna. Jeśli pole "Numer Amodit" pozostanie puste, zostanie dodany tylko profil sprawcy.
Numer Amodit: Ręcznie wprowadzany, unikalny identyfikator zdarzenia.
Pozostałe pola: Rodzaj zdarzenia, numer sklepu, data.
Pola Dynamiczne: Przycisk + Dodaj pole do zdarzenia pozwala dodać opcjonalne pola (Kwota, Opis).
1.5. Karta Szczegółów Sprawcy (Modal)
Otwierana po kliknięciu na kartę sprawcy w widoku "Katalog".
Galeria Zdjęć: Wyświetla wszystkie zdjęcia sprawcy. Kliknięcie na zdjęcie powiększa je na pełny ekran.
Dane Sprawcy: Wyświetla wszystkie wprowadzone dane profilowe.
Statystyki: Automatycznie obliczone i wyświetlone dane:
Data ostatniego ujęcia.
Suma kwot kradzieży (całkowita).
Suma kwot kradzieży od ostatniego ujęcia.
Lista unikalnych numerów sklepów, w których sprawca był widziany.
Historia Zdarzeń: Lista wszystkich zdarzeń powiązanych z danym sprawcą, posortowana od najnowszego.
Dostępne Akcje:
Edycja Sprawcy (✏️): Otwiera formularz edycji danych profilowych.
Edycja Zdarzenia (✏️): Przy każdym zdarzeniu, otwiera formularz edycji tego konkretnego zdarzenia.
Dodaj/Przypisz zdarzenie: Otwiera modal z dwiema opcjami: dodania zupełnie nowego zdarzenia do tego sprawcy lub przypisania istniejącego zdarzenia (po numerze Amodit).
Usuń Sprawcę: Po potwierdzeniu, usuwa profil sprawcy oraz wszystkie powiązane z nim zdarzenia.
1.6. Ustawienia (Ikona Zębatki)
Otwiera modal z informacjami o twórcy aplikacji.
Zawiera przycisk Wyczyść całą bazę.
1.7. Technologia
Aplikacja jest pojedynczym plikiem HTML.
Interfejs użytkownika jest zarządzany przez framework Vue.js.
Wszystkie dane są przechowywane lokalnie w przeglądarce za pomocą IndexedDB, z wykorzystaniem biblioteki Dexie.js jako uproszczonego interfejsu.
Aplikacja nie wymaga do działania połączenia z internetem (poza pierwszym załadowaniem bibliotek Vue i Dexie).