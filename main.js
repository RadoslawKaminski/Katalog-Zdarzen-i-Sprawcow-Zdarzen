// main.js

// === BAZA DANYCH (DEXIE.JS) ===
const db = new Dexie('AmobitSecurityVueDB');
// Wersja 4: Dodanie pola 'suspectDescription'
db.version(4).stores({
    suspects: '++id, nickname, gender, ageMin, ageMax, hairColor, hairLength, glasses, zarost, *tattoos',
    events: '&amobitId, suspectId, *theftType',
});
db.version(3).stores({
    suspects: '++id, nickname, gender, ageMin, ageMax, hairColor, hairLength, glasses, zarost, *tattoos',
    events: '&amobitId, suspectId, *theftType',
}).upgrade(tx => {
    return tx.table('suspects').toCollection().modify(s => {
        if (s.age) {
            const ageMap = {
                "Poniżej 18": { min: null, max: 17 }, "18-25": { min: 18, max: 25 },
                "26-40": { min: 26, max: 40 }, "41-60": { min: 41, max: 60 },
                "Powyżej 60": { min: 61, max: null }
            };
            const range = ageMap[s.age];
            if (range) { s.ageMin = range.min; s.ageMax = range.max; }
            delete s.age;
        }
    });
});
db.version(2).stores({
    suspects: '++id, nickname, gender, age, hairColor, hairLength, glasses, zarost, *tattoos',
    events: '&amobitId, suspectId, *theftType',
}).upgrade(tx => {
    return tx.table("events").toCollection().modify(event => {
        if (event.theftType === undefined) event.theftType = [];
        if (event.theftTypeOther === undefined) event.theftTypeOther = '';
    });
});

// === SCHEMATY PÓL ===
const fieldSchemas = {
    suspect: {
        nickname: { label: "Pseudonim", type: "text" },
        gender: { label: "Płeć", type: "select", options: ["Kobieta", "Mężczyzna", "Inne"] },
        hairColor: { label: "Kolor włosów", type: "select", options: ["Blond", "Brunet", "Czarne", "Rude", "Siwe", "Inny"] },
        hairLength: { label: "Długość włosów", type: "select", options: ["Krótkie", "Do ramion", "Długie", "Łysy"] },
        glasses: { label: "Okulary", type: "select", options: ["Tak", "Nie", "Nieraz"] },
        zarost: { label: "Zarost", type: "select", options: ["Brak", "Wąsy", "Broda", "Kozia bródka", "Kilkudniowy zarost"] },
        tattoos: { label: "Tatuaże", type: "checkbox", options: ["Prawa dłoń", "Lewa dłoń", "Prawe ramię", "Lewe ramię", "Szyja", "Nogi", "Twarz"] },
        suspectDescription: { label: "Dodatkowy opis sprawcy", type: "textarea" },
    },
    event: {
        amount: { label: "Kwota kradzieży", type: "number" },
        description: { label: "Opis zdarzenia", type: "textarea" },
        theftType: { label: "Typ kradzieży", type: "checkbox", options: ["biegacz (szczotki)", "perfumy maszynki itp", "KSO", "kolorówka", "wyjmuje z pudełek", "co popadnie, co w rączki wpadnie na sali", "inne"] },
    }
};

// === FUNKCJE POMOCNICZE DO IMPORTU/EKSPORTU ===
const blobToBase64 = blob => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
});

const base64ToBlob = (base64, type = 'application/octet-stream') => {
    const byteCharacters = atob(base64.split(',')[1]);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type });
}

// === GŁÓWNA INSTANCJA VUE.JS ===
new Vue({
    el: '#app',
    data: {
        isReady: false,
        activeView: 'baza',
        suspects: [],
        availableStores: [],
        searchPhrase: '',
        modals: {
            filters: { show: false },
            details: { show: false, data: { suspect: {}, events: [], stats: {} } },
            fields: { show: false, target: null, available: [] },
            addEvent: { show: false, suspectId: null, mode: 'new' },
            editSuspect: { show: false, data: {}, fields: [], photoUrls: [] },
            editEvent: { show: false, data: {} },
            settings: { show: false },
            fullscreenPhoto: { show: false, url: '' }
        },
        filters: {},
        addForm: {},
        addEventForm: {},
        assignEventId: '',
        fieldSchemas: fieldSchemas,
    },
    computed: {
        filterSchema() {
            const schema = {};
            for (const key in fieldSchemas.suspect) {
                // Wyświetlaj w filtrach tylko te pola, które mają zdefiniowane opcje (czyli select i checkbox)
                if (fieldSchemas.suspect[key].options) {
                    const originalOptions = fieldSchemas.suspect[key].options;
                    schema[key] = {
                        label: fieldSchemas.suspect[key].label,
                        options: [...originalOptions, "Nieokreślone"]
                    };
                }
            }
            return schema;
        },
        filteredSuspects() {
            if (!this.isReady) return [];
            const phrase = this.searchPhrase.toLowerCase().trim();
            const defaultAgeFilter = { min: 10, max: 90 };
            
            return this.suspects.filter(suspect => {
                // Filtr wieku (zakresy muszą się pokrywać)
                const filterRange = this.filters.ageRange;
                if (filterRange.min > defaultAgeFilter.min || filterRange.max < defaultAgeFilter.max) {
                    if (!suspect.ageMin && !suspect.ageMax) return false;
                    const overlaps = (suspect.ageMin || 0) <= filterRange.max && (suspect.ageMax || 999) >= filterRange.min;
                    if (!overlaps) return false;
                }

                // Filtry cech
                for (const key in this.filters) {
                    if (key === 'ageRange' || key === 'stores') continue;
                    const requiredValues = this.filters[key];
                    if (!requiredValues || requiredValues.length === 0) continue;
                    
                    const suspectValue = suspect[key];
                    const isUnspecified = suspectValue == null || suspectValue === '' || (Array.isArray(suspectValue) && suspectValue.length === 0);
                    
                    const match = requiredValues.some(required => {
                        if (required === 'Nieokreślone') return isUnspecified;
                        if (isUnspecified) return false;
                        if (Array.isArray(suspectValue)) return suspectValue.includes(required);
                        return suspectValue === required;
                    });
                    if (!match) return false;
                }

                // Filtr sklepów
                if (this.filters.stores && this.filters.stores.length > 0) {
                    if (!this.filters.stores.some(store => suspect.stores.includes(store))) {
                        return false;
                    }
                }
                
                // Wyszukiwanie frazą
                if (phrase) {
                    if (!suspect.searchableText.includes(phrase)) return false;
                }

                return true;
            });
        },
        activeFilterCount() {
            let count = 0;
            const defaultAgeFilter = { min: 10, max: 90 };
            for (const key in this.filters) {
                if (key === 'ageRange') {
                    if (this.filters.ageRange.min !== defaultAgeFilter.min || this.filters.ageRange.max !== defaultAgeFilter.max) {
                        count++;
                    }
                } else if (this.filters[key] && this.filters[key].length > 0) {
                    count += this.filters[key].length;
                }
            }
            return count;
        }
    },
    methods: {
        getSuspectSummary(suspect) {
            let parts = [];
            if (suspect.gender) parts.push(suspect.gender);
            if (suspect.ageMin || suspect.ageMax) parts.push(`${suspect.ageMin || '?'}-${suspect.ageMax || '?'} lat`);
            if (suspect.hairColor) parts.push(suspect.hairColor);
            return parts.filter(Boolean).join(', ');
        },
        switchView(viewName) { this.activeView = viewName; if (viewName === 'dodaj') this.resetAddForm(); },
        resetAddForm() {
            const defaultFields = ['gender', 'hairColor'].map(key => {
                const schema = fieldSchemas.suspect[key];
                return { key, ...schema, value: schema.type === 'checkbox' ? [] : '' };
            });

            this.addForm = {
                photos: [], photoUrls: [], 
                suspectFields: defaultFields, 
                eventFields: [],
                suspect: { ageMin: null, ageMax: null },
                event: { amobitId: '', type: '', storeNumber: '', date: new Date().toISOString().slice(0, 10), theftTypeOther: '' },
            };
        },
        resetAddEventForm() { this.addEventForm = { amobitId: '', type: '', storeNumber: '', date: new Date().toISOString().slice(0, 10), eventFields: [], theftTypeOther: '' }; },
        handlePhotoUpload(e) {
            this.addForm.photos = Array.from(e.target.files);
            this.addForm.photoUrls = this.addForm.photos.map(p => URL.createObjectURL(p));
        },
        openFieldSelectionMenu(target, forAddEventModal = false) {
            const form = forAddEventModal ? this.addEventForm : this.addForm;
            const existing = forAddEventModal ? form.eventFields.map(f => f.key) : (target === 'suspect' ? form.suspectFields.map(f => f.key) : form.eventFields.map(f => f.key));
            const schema = fieldSchemas[target];
            this.modals.fields.available = Object.keys(schema)
                .filter(key => !existing.includes(key))
                .map(key => ({ key, label: schema[key].label, target, forAddEventModal }));
            this.modals.fields.target = target;
            this.modals.fields.show = true;
        },
        addDynamicField(field) {
            const { target, key, forAddEventModal } = field;
            const schema = fieldSchemas[target][key];
            const newField = {
                key: key, label: schema.label, type: schema.type,
                options: schema.options, value: schema.type === 'checkbox' ? [] : '',
            };
            const form = forAddEventModal ? this.addEventForm : this.addForm;
            if (target === 'suspect') form.suspectFields.push(newField);
            else form.eventFields.push(newField);
            this.modals.fields.show = false;
        },
        async saveNewEntry() {
            if (this.addForm.photos.length === 0) return alert('Musisz dodać przynajmniej jedno zdjęcie sprawcy.');
            
            const suspectData = { 
                photos: this.addForm.photos,
                ageMin: this.addForm.suspect.ageMin,
                ageMax: this.addForm.suspect.ageMax
            };
            this.addForm.suspectFields.forEach(f => suspectData[f.key] = f.value);
            
            try {
                const suspectId = await db.suspects.add(suspectData);
                
                if (this.addForm.event.amobitId) {
                    const eventData = {
                        amobitId: this.addForm.event.amobitId, eventType: this.addForm.event.type || 'Wykrycie',
                        storeNumber: this.addForm.event.storeNumber,
                        eventDate: this.addForm.event.date ? new Date(this.addForm.event.date).toISOString() : null,
                        suspectId: suspectId
                    };
                    this.addForm.eventFields.forEach(f => {
                        if(f.key === 'amount') eventData.amount = parseFloat(f.value) || 0;
                        else if (f.key === 'theftType') eventData.theftType = f.value;
                        else eventData[f.key] = f.value;
                    });
                    if (eventData.theftType && eventData.theftType.includes('inne')) {
                        eventData.theftTypeOther = this.addForm.event.theftTypeOther;
                    }
                     await db.events.add(eventData);
                }
                alert('Pomyślnie dodano nowego sprawcę.');
                this.switchView('baza');
                this.loadSuspects();
            } catch (error) {
                if (error.name === 'ConstraintError') alert('Błąd: Numer Amodit musi być unikalny!');
                else alert('Wystąpił błąd podczas zapisu.');
                console.error('Błąd zapisu:', error);
            }
        },
        async loadSuspects() {
            const allSuspects = await db.suspects.toArray();
            const allEvents = await db.events.toArray();
            
            this.availableStores = [...new Set(allEvents.map(e => e.storeNumber).filter(Boolean))].sort((a, b) => a - b);
            
            this.suspects = allSuspects.map(s => {
                const relatedEvents = allEvents.filter(e => e.suspectId === s.id);
                const stores = [...new Set(relatedEvents.map(e => e.storeNumber).filter(Boolean))];
                const searchableText = (JSON.stringify(s) + JSON.stringify(relatedEvents)).toLowerCase();

                return { 
                    ...s, 
                    photoUrl: s.photos && s.photos.length > 0 ? URL.createObjectURL(s.photos[0]) : '', 
                    stores,
                    searchableText 
                };
            });
        },
        async showSuspectDetails(suspectId) {
            const suspect = await db.suspects.get(suspectId);
            const events = await db.events.where({ suspectId }).sortBy('eventDate');
            events.reverse();

            const lastApprehension = events.find(e => e.eventType === 'Ujęcie');
            const totalAmount = events.reduce((sum, e) => sum + (e.amount || 0), 0);
            let amountSinceApprehension = totalAmount;
            if(lastApprehension) {
                amountSinceApprehension = events.filter(e => !e.eventDate || !lastApprehension.eventDate || new Date(e.eventDate) > new Date(lastApprehension.eventDate)).reduce((sum, e) => sum + (e.amount || 0), 0);
            }
            const visitedStores = [...new Set(events.map(e => e.storeNumber).filter(Boolean))];

            this.modals.details.data = {
                suspect: { ...suspect, photoUrls: suspect.photos.map(p => URL.createObjectURL(p)) },
                events,
                stats: { lastApprehensionDate: lastApprehension ? new Date(lastApprehension.eventDate).toLocaleDateString('pl-PL') : null, totalAmount, amountSinceApprehension, visitedStores }
            };
            this.modals.details.show = true;
        },
        openEditSuspectModal(suspect) {
            this.modals.editSuspect.data = { ...suspect }; 
            if (!this.modals.editSuspect.data.photos) {
                this.modals.editSuspect.data.photos = [];
            }
            this.modals.editSuspect.photoUrls = this.modals.editSuspect.data.photos.map(p => URL.createObjectURL(p));
            
            this.modals.editSuspect.fields = Object.keys(fieldSchemas.suspect).map(key => {
                const schema = fieldSchemas.suspect[key];
                return { key, ...schema, value: suspect[key] || (schema.type === 'checkbox' ? [] : '') }
            });
            this.modals.details.show = false;
            this.modals.editSuspect.show = true;
        },
        async saveSuspectChanges() {
            const suspectData = this.modals.editSuspect.data;
            const updatedData = {
                ageMin: suspectData.ageMin,
                ageMax: suspectData.ageMax,
                photos: suspectData.photos
            };
            this.modals.editSuspect.fields.forEach(f => updatedData[f.key] = f.value);
            
            await db.suspects.update(suspectData.id, updatedData);
            alert('Dane sprawcy zaktualizowane.');
            this.modals.editSuspect.show = false;
            this.loadSuspects();
        },
        addPhotosToEdit(event) {
            const files = Array.from(event.target.files);
            files.forEach(file => {
                this.modals.editSuspect.data.photos.push(file);
                this.modals.editSuspect.photoUrls.push(URL.createObjectURL(file));
            });
            event.target.value = '';
        },
        removePhotoFromEdit(index) {
            this.modals.editSuspect.data.photos.splice(index, 1);
            this.modals.editSuspect.photoUrls.splice(index, 1);
        },
        openEditEventModal(event) {
            this.modals.editEvent.data = JSON.parse(JSON.stringify(event));
            if (!this.modals.editEvent.data.theftType) this.$set(this.modals.editEvent.data, 'theftType', []);
            if (this.modals.editEvent.data.eventDate) {
                this.modals.editEvent.data.dateForInput = new Date(this.modals.editEvent.data.eventDate).toISOString().slice(0, 10);
            }
            this.modals.details.show = false;
            this.modals.editEvent.show = true;
        },
        async saveEventChanges() {
            const eventData = this.modals.editEvent.data;
            const updates = {
                eventType: eventData.eventType, storeNumber: eventData.storeNumber,
                eventDate: eventData.dateForInput ? new Date(eventData.dateForInput).toISOString() : null,
                amount: parseFloat(eventData.amount) || 0, description: eventData.description,
                theftType: eventData.theftType || [], theftTypeOther: eventData.theftTypeOther || ''
            };
            await db.events.update(eventData.amobitId, updates);
            alert('Zdarzenie zaktualizowane.');
            this.modals.editEvent.show = false;
            this.loadSuspects();
        },
        resetFilters() {
            this.initializeFilters();
            this.modals.filters.show = false;
        },
        initializeFilters() {
            const filters = {};
            // NAPRAWIONY BŁĄD: Iteruj po kluczach z `filterSchema`, a nie `fieldSchemas`, aby uniknąć błędów.
            for (const key in this.filterSchema) {
                filters[key] = [];
            }
            filters.stores = [];
            filters.ageRange = { min: 10, max: 90 };
            this.filters = filters;
        },
        async seedDatabase() {
            if (!confirm("Czy na pewno chcesz dodać przykładowe dane? Usunie to wszystkie istniejące rekordy.")) return;
            await this.clearDatabase(false);

            const sampleData = [
                { suspect: { nickname: 'Broderia z Thotem', gender: 'Kobieta', ageMin: 28, ageMax: 35, hairColor: 'Blond', hairLength: 'Długie', zarost: 'Brak' }, event: { amobitId: 'AMOBIT-001', eventType: 'Udaremnienie', storeNumber: '123', amount: 150.50, theftType: ['perfumy maszynki itp'] } },
                { suspect: { nickname: 'Szybki Lopez', gender: 'Mężczyzna', ageMin: 20, ageMax: 24, hairColor: 'Czarne', hairLength: 'Krótkie', tattoos: ['Prawe ramię'], zarost: 'Kilkudniowy zarost' }, event: { amobitId: 'AMOBIT-002', eventType: 'Ujęcie', storeNumber: '456', amount: 320.00, theftType: ['biegacz (szczotki)', 'inne'], theftTypeOther: 'Ukradł też drogie alkohole' } },
                { suspect: { gender: 'Mężczyzna', ageMin: 50, ageMax: 60, hairColor: '', hairLength: 'Łysy', glasses: 'Tak' }, event: { amobitId: 'AMOBIT-003', eventType: 'Wykrycie', storeNumber: '123', description: 'Stały klient.' } },
            ];
            
            const canvas = document.createElement('canvas'); canvas.width = 100; canvas.height = 100;
            const ctx = canvas.getContext('2d'); ctx.fillStyle = '#ccc'; ctx.fillRect(0, 0, 100, 100);
            const placeholderBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));

            for (const entry of sampleData) {
                entry.suspect.photos = [placeholderBlob];
                const suspectId = await db.suspects.add(entry.suspect);
                entry.event.suspectId = suspectId;
                entry.event.eventDate = new Date(Date.now() - Math.random() * 1e10).toISOString();
                await db.events.add(entry.event);
            }
            alert('Dodano dane przykładowe.');
            this.loadSuspects();
        },
        async clearDatabase(confirmFirst = true) {
            if (confirmFirst && !confirm("Czy na pewno chcesz usunąć WSZYSTKIE dane z bazy? Tej operacji nie można cofnąć.")) return;
            await db.delete();
            await db.open();
            if (confirmFirst) alert('Baza danych została wyczyszczona.');
            this.modals.settings.show = false;
            this.loadSuspects();
        },
        openAddEventModal(suspectId) {
            this.resetAddEventForm();
            this.modals.addEvent.suspectId = suspectId;
            this.modals.addEvent.show = true;
        },
        async saveNewEventToSuspect() {
            const form = this.addEventForm;
            if (!form.amobitId) return alert('Musisz podać numer Amodit.');

            const eventData = {
                amobitId: form.amobitId, eventType: form.type,
                storeNumber: form.storeNumber, eventDate: form.date ? new Date(form.date).toISOString() : null,
                suspectId: this.modals.addEvent.suspectId
            };
            form.eventFields.forEach(f => {
                if (f.key === 'amount') eventData.amount = parseFloat(f.value) || 0;
                else if (f.key === 'theftType') eventData.theftType = f.value;
                else eventData[f.key] = f.value;
            });
            if (eventData.theftType && eventData.theftType.includes('inne')) {
                eventData.theftTypeOther = form.theftTypeOther;
            }

            try {
                await db.events.add(eventData);
                alert('Dodano nowe zdarzenie.');
                this.modals.addEvent.show = false;
                this.showSuspectDetails(this.modals.addEvent.suspectId);
            } catch (error) {
                if (error.name === 'ConstraintError') alert('Błąd: Numer Amodit musi być unikalny!');
                else alert('Wystąpił błąd podczas zapisu.');
            }
        },
        async assignExistingEvent() {
            const amobitId = this.assignEventId;
            if (!amobitId) return alert('Wpisz numer Amodit.');

            const event = await db.events.get(amobitId);
            if (!event) return alert('Nie znaleziono zdarzenia o podanym numerze Amodit.');

            await db.events.update(amobitId, { suspectId: this.modals.addEvent.suspectId });
            alert(`Zdarzenie ${amobitId} zostało przypisane.`);
            this.assignEventId = '';
            this.modals.addEvent.show = false;
            this.showSuspectDetails(this.modals.addEvent.suspectId);
        },
        async deleteSuspect(suspectId) {
            if (!confirm(`Czy na pewno chcesz usunąć sprawcę #${suspectId} i wszystkie jego zdarzenia? Tej operacji nie można cofnąć.`)) return;

            try {
                await db.transaction('rw', db.suspects, db.events, async () => {
                    await db.events.where({ suspectId }).delete();
                    await db.suspects.delete(suspectId);
                });
                alert(`Sprawca #${suspectId} został usunięty.`);
                this.modals.details.show = false;
                this.loadSuspects();
            } catch (error) {
                alert('Wystąpił błąd podczas usuwania.');
                console.error('Błąd usuwania:', error);
            }
        },
        showFullscreenPhoto(url) {
            this.modals.fullscreenPhoto.url = url;
            this.modals.fullscreenPhoto.show = true;
        },
        async exportDatabase() {
            try {
                const allSuspects = await db.suspects.toArray();
                const allEvents = await db.events.toArray();

                const serializableSuspects = await Promise.all(allSuspects.map(async s => {
                    const photosAsBase64 = await Promise.all((s.photos || []).map(p => blobToBase64(p)));
                    return { ...s, id: s.id, photos: photosAsBase64 };
                }));

                const dataToExport = {
                    suspects: serializableSuspects,
                    events: allEvents
                };

                const jsonString = JSON.stringify(dataToExport, null, 2);
                const blob = new Blob([jsonString], { type: 'application/json' });
                
                const timestamp = new Date().toISOString().slice(0, 10);
                const filename = `katalog-sprawcow-backup-${timestamp}.json`;

                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(link.href);

                alert('Eksport danych zakończony pomyślnie.');
            } catch (error) {
                console.error('Błąd podczas eksportu:', error);
                alert('Wystąpił błąd podczas eksportu danych.');
            }
        },
        async importDatabase(event, mode) {
            const file = event.target.files[0];
            if (!file) return;

            const confirmMessages = {
                replace: "Import ZASTĄPI całą obecną bazę. Czy na pewno chcesz kontynuować?",
                merge: "Import POŁĄCZY dane. Zostaną dodane tylko brakujące zdarzenia i powiązani z nimi sprawcy. Kontynuować?",
                addAll: "Import DODA wszystkie dane z pliku jako nowe wpisy (oprócz zdarzeń o tym samym ID). Kontynuować?"
            };

            if (!confirm(confirmMessages[mode])) {
                event.target.value = '';
                return;
            }

            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const importedData = JSON.parse(e.target.result);
                    if (!importedData.suspects || !importedData.events) throw new Error("Plik importu ma nieprawidłową strukturę.");

                    const suspectsWithBlobs = importedData.suspects.map(s => {
                        const photosAsBlobs = (s.photos || []).map(base64String => {
                            const mimeType = base64String.match(/:(.*?);/)[1];
                            return base64ToBlob(base64String, mimeType);
                        });
                        return { ...s, photos: photosAsBlobs };
                    });

                    await db.transaction('rw', db.suspects, db.events, async () => {
                        const oldIdToNewIdMap = new Map();
                        
                        if (mode === 'replace') {
                            await db.suspects.clear();
                            await db.events.clear();
                        }

                        let suspectsToAdd = [];
                        let eventsToAdd = [];

                        if (mode === 'replace' || mode === 'addAll') {
                            suspectsToAdd = suspectsWithBlobs;
                            const existingAmobitIds = new Set(await db.events.toCollection().keys());
                            eventsToAdd = importedData.events.filter(ev => !existingAmobitIds.has(ev.amobitId));
                        } else if (mode === 'merge') {
                            const existingAmobitIds = new Set(await db.events.toCollection().keys());
                            eventsToAdd = importedData.events.filter(ev => !existingAmobitIds.has(ev.amobitId));
                            
                            const requiredSuspectIds = new Set(eventsToAdd.map(ev => ev.suspectId));
                            
                            suspectsToAdd = suspectsWithBlobs.filter(s => requiredSuspectIds.has(s.id));
                        }
                        
                        if (suspectsToAdd.length === 0 && eventsToAdd.length === 0) {
                            alert("Brak nowych danych do zaimportowania.");
                            return;
                        }

                        for (const suspect of suspectsToAdd) {
                            const originalId = suspect.id;
                            delete suspect.id;
                            const newId = await db.suspects.add(suspect);
                            oldIdToNewIdMap.set(originalId, newId);
                        }

                        const remappedEvents = eventsToAdd.map(event => {
                            const newSuspectId = oldIdToNewIdMap.get(event.suspectId);
                            if (newSuspectId) {
                                return { ...event, suspectId: newSuspectId };
                            }
                            return null;
                        }).filter(Boolean);

                        if (remappedEvents.length > 0) {
                            await db.events.bulkAdd(remappedEvents);
                        }
                        
                        alert(`Import zakończony pomyślnie. Dodano ${oldIdToNewIdMap.size} sprawców i ${remappedEvents.length} zdarzeń.`);
                    });

                    this.modals.settings.show = false;
                    await this.loadSuspects();
                } catch (error) {
                    console.error("Błąd importu:", error);
                    alert(`Wystąpił błąd podczas importu: ${error.message}`);
                } finally {
                    event.target.value = '';
                }
            };
            reader.readAsText(file);
        },
    },
    async mounted() {
        this.initializeFilters();
        await this.loadSuspects();
        this.resetAddForm();
        this.resetAddEventForm();
        this.isReady = true;
    }
});
