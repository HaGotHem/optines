# Guide de Test - Système de Gestion des Employés

## Préparation

### 1. Démarrer le serveur API
```bash
node server.js
```

### 2. Exécuter le script de mise à jour de la base de données
```bash
# Connectez-vous à votre base de données Supabase et exécutez le contenu du fichier :
# update_team_members_schema.sql
```

## Tests pour les Directeurs

### Test 1: Accès à la gestion des employés
1. Connectez-vous en tant que directeur
2. Sur la page directeur, cliquez sur l'icône verte "Users" dans l'en-tête
3. Vérifiez que vous arrivez sur la page "Gestion des Employés"

### Test 2: Créer un employé
1. Cliquez sur "Ajouter" dans l'en-tête
2. Remplissez le formulaire :
   - Nom complet: "Jean Dupont"
   - Poste: "Employé libre-service"
   - Section: "fruits-legumes"
   - Localisation: "Zone 1"
   - Téléphone: "0123456789"
   - Email: "jean.dupont@example.com"
   - Équipe: "matin"
   - Manager: Sélectionnez un manager
3. Cliquez sur "Créer"
4. Vérifiez que l'employé apparaît dans la liste

### Test 3: Modifier un employé
1. Cliquez sur l'icône "Modifier" (crayon) d'un employé
2. Modifiez les informations
3. Cliquez sur "Modifier"
4. Vérifiez que les modifications sont sauvegardées

### Test 4: Supprimer un employé
1. Cliquez sur l'icône "Supprimer" (poubelle) d'un employé
2. Confirmez la suppression
3. Vérifiez que l'employé disparaît de la liste

### Test 5: Filtrage par magasin
- Les directeurs ne voient que les employés de leur magasin
- Vérifiez que les employés d'autres magasins ne sont pas visibles

## Tests pour les Managers

### Test 1: Accès à la page équipe
1. Connectez-vous en tant que manager
2. Allez sur l'onglet "Équipe"
3. Vérifiez que le titre affiche "Équipe [votre-section]"

### Test 2: Voir les employés de sa section
1. Vérifiez que seuls les employés de votre section sont visibles
2. Les employés d'autres sections ne doivent pas apparaître

### Test 3: Ajouter un employé dans sa section
1. Cliquez sur le bouton "+" pour ajouter un employé
2. Remplissez le formulaire (la section devrait être pré-remplie)
3. Créez l'employé
4. Vérifiez qu'il apparaît dans votre équipe

### Test 4: Modifier un employé de sa section
1. Modifiez un employé existant
2. Vérifiez que les modifications sont sauvegardées
3. Testez la modification de section (l'employé devrait disparaître de votre liste s'il change de section)

### Test 5: Statistiques d'équipe
1. Vérifiez que les statistiques affichent :
   - Nombre d'employés de votre section
   - Performance moyenne
   - Nombre d'employés actifs
   - Total des tâches

## Tests d'API

### Test des endpoints
```bash
# Lister tous les employés
curl http://localhost:3001/api/employees

# Filtrer par magasin
curl http://localhost:3001/api/employees?store_id=1

# Filtrer par section
curl http://localhost:3001/api/employees?section=fruits-legumes

# Créer un employé
curl -X POST http://localhost:3001/api/employees \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Employee",
    "role": "Employé",
    "section": "test",
    "location": "Zone Test",
    "shift": "matin",
    "manager_id": 1,
    "store_id": 1
  }'
```

## Vérifications de Base de Données

### Vérifier la structure
```sql
-- Vérifier que la colonne section existe
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'team_members' AND column_name = 'section';

-- Vérifier la vue
SELECT * FROM team_members_with_store LIMIT 5;
```

### Vérifier les données
```sql
-- Voir tous les employés avec leurs sections
SELECT id, name, role, section, store_id, manager_id 
FROM team_members 
ORDER BY section, name;

-- Compter par section
SELECT section, COUNT(*) as count 
FROM team_members 
GROUP BY section;
```

## Résolution des Problèmes

### Problème: Employés non visibles
- Vérifiez que la colonne `section` est bien remplie
- Vérifiez que le manager a bien une section définie
- Vérifiez les filtres dans les hooks

### Problème: Erreur de création
- Vérifiez que tous les champs obligatoires sont remplis
- Vérifiez que le manager_id et store_id existent
- Vérifiez les logs du serveur

### Problème: Permissions
- Vérifiez que les politiques RLS sont correctement configurées
- Vérifiez que l'utilisateur connecté a les bonnes permissions

## Résultats Attendus

### Pour les Directeurs
- Peuvent voir tous les employés de leur magasin
- Peuvent créer, modifier et supprimer des employés
- Interface complète de gestion

### Pour les Managers
- Ne voient que les employés de leur section
- Peuvent gérer leur équipe
- Statistiques spécifiques à leur section

### Séparation des Données
- Employés ≠ Utilisateurs de l'app
- Filtrage correct par magasin et section
- Intégrité des données respectée 