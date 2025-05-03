// Gestion du formulaire d'upload
document.getElementById('uploadForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const fileInput = document.getElementById('retinalImage');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('Veuillez sélectionner une image');
        return;
    }

    // Afficher le statut d'analyse
    document.getElementById('detectionResult').innerHTML = '<i class="icofont-spinner-alt-4"></i> Analyse en cours...';
    document.getElementById('recommendations').textContent = 'Analyse en cours...';
    
    try {
        // Préparation de l'image pour l'analyse
        const formData = new FormData();
        formData.append('image', file);
        
        // Envoi de l'image au serveur pour analyse
        const response = await fetch('/api/analyze', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error('Erreur lors de l\'analyse');
        }
        
        const result = await response.json();
        
        // Mise à jour de l'interface avec les résultats
        updateResults(result);
        
    } catch (error) {
        console.error('Erreur:', error);
        document.getElementById('detectionResult').innerHTML = '<i class="icofont-close-circled"></i> Erreur lors de l\'analyse';
        document.getElementById('recommendations').textContent = 'Une erreur est survenue. Veuillez réessayer.';
    }
});

// Fonction pour mettre à jour les résultats
function updateResults(result) {
    // Mise à jour de la date
    document.getElementById('analysisDate').textContent = new Date().toLocaleDateString('fr-FR');
    
    // Mise à jour du résultat
    const resultStatus = document.getElementById('detectionResult');
    if (result.detected) {
        resultStatus.innerHTML = '<i class="icofont-warning"></i> Signes de rétinopathie détectés';
        resultStatus.classList.add('warning');
    } else {
        resultStatus.innerHTML = '<i class="icofont-check-circled"></i> Aucun signe de rétinopathie détecté';
        resultStatus.classList.add('success');
    }
    
    // Mise à jour du niveau de confiance
    const confidenceBar = document.querySelector('.progress-bar');
    const confidenceText = document.querySelector('.confidence-level span');
    confidenceBar.style.width = `${result.confidence}%`;
    confidenceText.textContent = `${result.confidence}%`;
    
    // Mise à jour des recommandations
    const recommendations = document.getElementById('recommendations');
    if (result.detected) {
        recommendations.innerHTML = `
            <p>Des signes de rétinopathie ont été détectés avec un niveau de confiance de ${result.confidence}%.</p>
            <p>Nous vous recommandons de :</p>
            <ul>
                <li>Prendre rendez-vous avec un ophtalmologue dans les plus brefs délais</li>
                <li>Consulter votre médecin traitant pour ajuster votre traitement si nécessaire</li>
                <li>Effectuer un suivi régulier de votre glycémie</li>
            </ul>
        `;
    } else {
        recommendations.innerHTML = `
            <p>Aucun signe de rétinopathie n'a été détecté avec un niveau de confiance de ${result.confidence}%.</p>
            <p>Nous vous recommandons de :</p>
            <ul>
                <li>Continuer à effectuer des dépistages réguliers (au moins une fois par an)</li>
                <li>Maintenir un bon contrôle de votre glycémie</li>
                <li>Consulter votre médecin traitant pour un suivi régulier</li>
            </ul>
        `;
    }
}

// Validation du type de fichier
document.getElementById('retinalImage').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        if (!validTypes.includes(file.type)) {
            alert('Veuillez sélectionner une image au format JPG, JPEG ou PNG');
            this.value = '';
        }
    }
});

// Gestion de l'authentification
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        if (!response.ok) {
            throw new Error('Identifiants incorrects');
        }
        
        const data = await response.json();
        
        // Stockage du token
        localStorage.setItem('authToken', data.token);
        
        // Passage à l'étape suivante
        document.getElementById('step1').classList.remove('active');
        document.getElementById('step2').classList.add('active');
        
    } catch (error) {
        alert('Erreur de connexion : ' + error.message);
    }
});

// Gestion de la vérification médicale
document.getElementById('medicalForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const patientId = document.getElementById('patientId').value;
    const birthDate = document.getElementById('birthDate').value;
    const diabetesType = document.getElementById('diabetesType').value;
    const token = localStorage.getItem('authToken');
    
    try {
        const response = await fetch('/api/patient/verify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                patientId,
                birthDate,
                diabetesType
            })
        });
        
        if (!response.ok) {
            throw new Error('Informations médicales invalides');
        }
        
        // Affichage des sections de détection et résultats
        document.querySelector('.auth-section').style.display = 'none';
        document.querySelector('.detection-section').style.display = 'block';
        document.querySelector('.results-section').style.display = 'block';
        
    } catch (error) {
        alert('Erreur de vérification : ' + error.message);
    }
});

// Vérification de l'authentification au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('authToken');
    if (token) {
        // Vérification de la validité du token
        fetch('/api/auth/verify', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => {
            if (response.ok) {
                // Si le token est valide, on passe directement à l'étape 2
                document.getElementById('step1').classList.remove('active');
                document.getElementById('step2').classList.add('active');
            } else {
                // Si le token est invalide, on déconnecte l'utilisateur
                localStorage.removeItem('authToken');
            }
        })
        .catch(() => {
            localStorage.removeItem('authToken');
        });
    }
}); 