// Zmienne globalne
    let zadania = [];
    let idDoEdycji = null;

    // Pobranie danych z localStorage przy starcie
    let zapisaneZadania = localStorage.getItem('studyflow_zadania');
    if (zapisaneZadania != null) {
        zadania = JSON.parse(zapisaneZadania);
    }

    // Pobieranie elementów z HTML
    const inputTytul = document.getElementById('input-title');
    const inputPrzedmiot = document.getElementById('input-subject');
    const inputData = document.getElementById('input-date');
    const inputPriorytet = document.getElementById('input-priority');
    const inputOpis = document.getElementById('input-desc');
    const przyciskDodaj = document.getElementById('btn-add');
    const przyciskAnuluj = document.getElementById('btn-cancel');
    const listaZadanHTML = document.getElementById('task-list');
    const tytulFormularza = document.getElementById('form-title');
    const grupaTytulu = document.getElementById('title-group');

    // Obsługa motywu
    const themeToggle = document.getElementById('theme-toggle');
    
    if (localStorage.getItem('studyflow_theme') === 'dark') {
        document.body.classList.add('dark-mode');
        themeToggle.innerText = '☀️ Tryb jasny';
    }

    themeToggle.addEventListener('click', function() {
        if (document.body.classList.contains('dark-mode')) {
            document.body.classList.remove('dark-mode');
            localStorage.setItem('studyflow_theme', 'light');
            themeToggle.innerText = '🌙 Tryb ciemny';
        } else {
            document.body.classList.add('dark-mode');
            localStorage.setItem('studyflow_theme', 'dark');
            themeToggle.innerText = '☀️ Tryb jasny';
        }
    });

    // Funkcja odświeżająca statystyki
    function aktualizujStatystyki() {
        document.getElementById('stat-total').innerText = zadania.length;
        
        let ukonczone = 0;
        let doZrobienia = 0;
        
        for (let i = 0; i < zadania.length; i++) {
            if (zadania[i].completed == true) {
                ukonczone++;
            } else {
                doZrobienia++;
            }
        }
        
        document.getElementById('stat-completed').innerText = ukonczone;
        document.getElementById('stat-upcoming').innerText = doZrobienia;
    }

    // Funkcja renderująca listę
    function pokazZadania() {
        listaZadanHTML.innerHTML = ''; // czyszczenie listy
        
        let wartoscSzukajki = document.getElementById('search-input').value.toLowerCase();
        let wartoscFiltru = document.getElementById('filter-subject').value;
        let wartoscSortowania = document.getElementById('sort-by').value;
        let czyPokazacSkonczone = document.getElementById('show-completed').checked;

        // Kopia tablicy do filtrowania
        let zadaniaDoPokazania = [];

        // Filtrowanie ręczne za pomocą zwykłej pętli
        for (let i = 0; i < zadania.length; i++) {
            let z = zadania[i];
            
            if (czyPokazacSkonczone == false && z.completed == true) {
                continue; // pomiń
            }
            if (wartoscFiltru !== 'All' && z.subject !== wartoscFiltru) {
                continue; // pomiń
            }
            if (wartoscSzukajki !== '' && z.title.toLowerCase().indexOf(wartoscSzukajki) === -1) {
                continue; // pomiń
            }
            
            zadaniaDoPokazania.push(z);
        }

        // Sortowanie
        zadaniaDoPokazania.sort(function(a, b) {
            if (wartoscSortowania === 'dueDate') {
                if (!a.dueDate) return 1;
                if (!b.dueDate) return -1;
                return new Date(a.dueDate) - new Date(b.dueDate);
            } else if (wartoscSortowania === 'priority') {
                let priorytety = { 'Wysoki': 3, 'Średni': 2, 'Niski': 1 };
                return priorytety[b.priority] - priorytety[a.priority];
            }
        });

        // Generowanie HTML
        for (let i = 0; i < zadaniaDoPokazania.length; i++) {
            let task = zadaniaDoPokazania[i];
            let li = document.createElement('li');
            li.className = 'task-item';
            
            if (task.completed == true) {
                li.classList.add('completed');
            }

            // Sprawdzanie opóźnienia
            let opoznioneHTML = '';
            if (task.dueDate != '' && task.completed == false) {
                let dzisiaj = new Date();
                let dataOddania = new Date(task.dueDate);
                dataOddania.setHours(23, 59, 59);
                
                if (dzisiaj > dataOddania) {
                    li.classList.add('overdue');
                    let roznica = dzisiaj.getTime() - dataOddania.getTime();
                    let dniOpoznienia = Math.ceil(roznica / (1000 * 3600 * 24));
                    opoznioneHTML = `<span class="overdue-text">• Opóźnione o ${dniOpoznienia} dni!</span>`;
                }
            }

            // Znaczniki (Tagi)
            let tagiHTML = '';
            if (task.subject != '') {
                tagiHTML += `<span class="tag tag-subject">${task.subject}</span>`;
            }
            
            let klasaPriorytetu = '';
            if (task.priority === 'Wysoki') klasaPriorytetu = 'priority-Wysoki';
            tagiHTML += `<span class="tag tag-priority ${klasaPriorytetu}">${task.priority}</span>`;

            // HTML dla pojedynczego zadania
            let opisHTML = '';
            if (task.description != '') {
                opisHTML = `<div style="margin-top: 10px; font-size: 13px;">${task.description}</div>`;
            }

            let dataHTML = '';
            if (task.dueDate != '') {
                dataHTML = `<div class="task-meta">Termin: ${task.dueDate} ${opoznioneHTML}</div>`;
            }

            let checkedBox = '';
            if (task.completed == true) {
                checkedBox = 'checked';
            }

            li.innerHTML = `
                <input type="checkbox" class="task-checkbox" ${checkedBox} onclick="zmienStatus(${task.id})">
                <div class="task-content">
                    <div class="task-title">${task.title}</div>
                    <div class="task-tags">${tagiHTML}</div>
                    ${dataHTML}
                    ${opisHTML}
                </div>
                <div class="task-actions">
                    <button class="btn-action" onclick="edytujZadanie(${task.id})">✎ Edytuj</button>
                    <button class="btn-action delete" onclick="usunZadanie(${task.id})">❌ Usuń</button>
                </div>
            `;
            
            listaZadanHTML.appendChild(li);
        }

        aktualizujStatystyki();
        aktualizujSelectPrzedmiotow();
    }

    // Funkcja aktualizująca select z przedmiotami
    function aktualizujSelectPrzedmiotow() {
        let select = document.getElementById('filter-subject');
        let aktualnyWybor = select.value;
        
        select.innerHTML = '<option value="All">Wszystkie przedmioty</option>';
        
        let dodanePrzedmioty = [];
        for (let i = 0; i < zadania.length; i++) {
            let przedmiot = zadania[i].subject;
            if (przedmiot != '' && dodanePrzedmioty.includes(przedmiot) == false) {
                dodanePrzedmioty.push(przedmiot);
                select.innerHTML += `<option value="${przedmiot}">${przedmiot}</option>`;
            }
        }
        
        select.value = aktualnyWybor;
    }

    // Dodawanie i zapisywanie zadań
    przyciskDodaj.addEventListener('click', function() {
        let tytul = inputTytul.value;
        
        if (tytul === '') {
            grupaTytulu.classList.add('error');
            alert('Proszę podać tytuł zadania!');
            return;
        } else {
            grupaTytulu.classList.remove('error');
        }

        if (idDoEdycji != null) {
            // Edycja istniejącego
            for (let i = 0; i < zadania.length; i++) {
                if (zadania[i].id === idDoEdycji) {
                    zadania[i].title = inputTytul.value;
                    zadania[i].subject = inputPrzedmiot.value;
                    zadania[i].dueDate = inputData.value;
                    zadania[i].priority = inputPriorytet.value;
                    zadania[i].description = inputOpis.value;
                }
            }
            wyczyscFormularz();
        } else {
            // Nowe zadanie
            let noweZadanie = {
                id: Date.now(), // generowanie unikalnego ID z czasu
                title: inputTytul.value,
                subject: inputPrzedmiot.value,
                dueDate: inputData.value,
                priority: inputPriorytet.value,
                description: inputOpis.value,
                completed: false
            };
            zadania.push(noweZadanie);
            wyczyscFormularz();
        }
        
        zapiszWDanych();
    });

    // Zapisywanie do Local Storage
    function zapiszWDanych() {
        localStorage.setItem('studyflow_zadania', JSON.stringify(zadania));
        pokazZadania();
    }

    // Usuwanie zadania
    window.usunZadanie = function(id) {
        let noweZadania = [];
        for (let i = 0; i < zadania.length; i++) {
            if (zadania[i].id !== id) {
                noweZadania.push(zadania[i]);
            }
        }
        zadania = noweZadania;
        
        if (idDoEdycji === id) {
            wyczyscFormularz();
        }
        zapiszWDanych();
    }

    // Oznaczanie jako zrobione
    window.zmienStatus = function(id) {
        for (let i = 0; i < zadania.length; i++) {
            if (zadania[i].id === id) {
                if (zadania[i].completed == true) {
                    zadania[i].completed = false;
                } else {
                    zadania[i].completed = true;
                }
            }
        }
        zapiszWDanych();
    }

    // Edycja zadania
    window.edytujZadanie = function(id) {
        for (let i = 0; i < zadania.length; i++) {
            if (zadania[i].id === id) {
                inputTytul.value = zadania[i].title;
                inputPrzedmiot.value = zadania[i].subject;
                inputData.value = zadania[i].dueDate;
                inputPriorytet.value = zadania[i].priority;
                inputOpis.value = zadania[i].description;
                
                idDoEdycji = id;
                tytulFormularza.innerText = "Edytuj Zadanie";
                przyciskDodaj.innerText = "Zapisz zmiany";
                przyciskDodaj.classList.add('edit-mode');
                przyciskAnuluj.style.display = 'block';
                
                grupaTytulu.classList.remove('error');
                window.scrollTo(0, 0); // przewiń do góry
            }
        }
    }

    // Resetowanie formularza
    function wyczyscFormularz() {
        inputTytul.value = '';
        inputPrzedmiot.value = '';
        inputData.value = '';
        inputOpis.value = '';
        inputPriorytet.value = 'Średni';
        
        idDoEdycji = null;
        tytulFormularza.innerText = "Dodaj Zadanie";
        przyciskDodaj.innerText = "Dodaj Zadanie";
        przyciskDodaj.classList.remove('edit-mode');
        przyciskAnuluj.style.display = 'none';
        grupaTytulu.classList.remove('error');
    }

    przyciskAnuluj.addEventListener('click', wyczyscFormularz);

    // Event listenery dla filtrów
    document.getElementById('filter-subject').addEventListener('change', pokazZadania);
    document.getElementById('sort-by').addEventListener('change', pokazZadania);
    document.getElementById('show-completed').addEventListener('change', pokazZadania);
    document.getElementById('search-input').addEventListener('input', pokazZadania);

    // Pierwsze uruchomienie
    pokazZadania();
