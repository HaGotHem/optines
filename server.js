const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(cors());

// Configuration Supabase avec la bonne URL et clé
const SUPABASE_URL = 'https://vqwgnvrhcaosnjczuwth.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxd2dudnJoY2Fvc25qY3p1d3RoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTk4NzQyNCwiZXhwIjoyMDY3NTYzNDI0fQ.H_YkS5VWgYY2c9-F08b5gz_2ofJGclXyM00BXZzz9Mk';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// Route de test
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API de gestion d\'utilisateurs opérationnelle' });
});

// Créer un utilisateur (Auth + table users)
app.post('/api/users', async (req, res) => {
  try {
    const { email, password, username, role, full_name, section, store_id, is_active = true } = req.body;

    // Validation des champs obligatoires
    if (!email || !password || !username || !role || !full_name || !store_id) {
      return res.status(400).json({ 
        error: 'Les champs email, password, username, role, full_name et store_id sont requis' 
      });
    }

    // Vérifier que le magasin existe
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id')
      .eq('id', store_id)
      .single();

    if (storeError || !store) {
      return res.status(400).json({ error: 'Le magasin spécifié n\'existe pas' });
    }

    // 1. Créer dans Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username, role, full_name, store_id }
    });

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    const userId = authData.user.id;

    // 2. Ajouter dans la table users
    const { error: dbError } = await supabase
      .from('users')
      .insert([{ 
        id: userId, 
        username, 
        email, 
        role,
        full_name,
        section: section || null,
        store_id,
        is_active
      }]);

    if (dbError) {
      // Si erreur dans la table, supprimer l'utilisateur Auth créé
      await supabase.auth.admin.deleteUser(userId);
      return res.status(400).json({ error: dbError.message });
    }

    res.json({ 
      success: true, 
      user: { 
        id: userId, 
        email, 
        username, 
        role,
        full_name,
        section,
        store_id,
        is_active
      } 
    });

  } catch (error) {
    console.error('Erreur création utilisateur:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Modifier un utilisateur (Auth + table users)
app.put('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { email, username, role, password, full_name, section, store_id, is_active } = req.body;

    console.log('🔧 Mise à jour utilisateur - Données reçues:', {
      id,
      email,
      username,
      role,
      password: password ? '[PRESENT]' : '[ABSENT]',
      full_name,
      section,
      store_id,
      is_active
    });

    // Vérifier que le magasin existe si fourni
    if (store_id) {
      console.log('🔍 Vérification du magasin:', store_id);
      const { data: store, error: storeError } = await supabase
        .from('stores')
        .select('id')
        .eq('id', store_id)
        .single();

      if (storeError || !store) {
        console.error('❌ Magasin non trouvé:', store_id, storeError);
        return res.status(400).json({ error: 'Le magasin spécifié n\'existe pas' });
      }
      console.log('✅ Magasin trouvé:', store);
    }

    // Préparer les mises à jour pour Auth
    const authUpdates = {};
    if (email) authUpdates.email = email;
    if (password) authUpdates.password = password;
    
    // Mettre à jour les user_metadata si nécessaire
    if (username || role || full_name || store_id) {
      const { data: currentUser } = await supabase.auth.admin.getUserById(id);
      const currentMetadata = currentUser?.user?.user_metadata || {};
      
      authUpdates.user_metadata = {
        ...currentMetadata,
        ...(username && { username }),
        ...(role && { role }),
        ...(full_name && { full_name }),
        ...(store_id && { store_id })
      };
    }

    // 1. Mettre à jour dans Auth (si il y a des changements)
    if (Object.keys(authUpdates).length > 0) {
      console.log('🔐 Mise à jour Auth:', authUpdates);
      const { error: authError } = await supabase.auth.admin.updateUserById(id, authUpdates);
      if (authError) {
        console.error('❌ Erreur Auth:', authError);
        return res.status(400).json({ error: authError.message });
      }
      console.log('✅ Mise à jour Auth réussie');
    } else {
      console.log('ℹ️  Aucune mise à jour Auth nécessaire');
    }

    // 2. Mettre à jour dans la table users
    const userUpdates = {};
    if (email !== undefined) userUpdates.email = email;
    if (username !== undefined) userUpdates.username = username;
    if (role !== undefined) userUpdates.role = role;
    if (full_name !== undefined) userUpdates.full_name = full_name;
    if (section !== undefined) userUpdates.section = section;
    if (store_id !== undefined) userUpdates.store_id = store_id;
    if (is_active !== undefined) userUpdates.is_active = is_active;

    if (Object.keys(userUpdates).length > 0) {
      console.log('🗄️  Mise à jour base de données:', userUpdates);
      const { error: dbError } = await supabase
        .from('users')
        .update(userUpdates)
        .eq('id', id);

      if (dbError) {
        console.error('❌ Erreur base de données:', dbError);
        return res.status(400).json({ error: dbError.message });
      }
      console.log('✅ Mise à jour base de données réussie');
    } else {
      console.log('ℹ️  Aucune mise à jour base de données nécessaire');
    }

    console.log('✅ Mise à jour utilisateur terminée avec succès');
    res.json({ success: true, message: 'Utilisateur modifié avec succès' });

  } catch (error) {
    console.error('❌ Erreur modification utilisateur:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Supprimer un utilisateur (Auth + table users)
app.delete('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Supprimer de la table users d'abord
    const { error: dbError } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (dbError) {
      return res.status(400).json({ error: dbError.message });
    }

    // 2. Supprimer de Auth
    const { error: authError } = await supabase.auth.admin.deleteUser(id);
    if (authError) {
      console.error('Erreur suppression Auth (utilisateur déjà supprimé de la table):', authError);
      // On continue car l'utilisateur a été supprimé de la table
    }

    res.json({ success: true, message: 'Utilisateur supprimé avec succès' });

  } catch (error) {
    console.error('Erreur suppression utilisateur:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Lister tous les utilisateurs avec informations des magasins
app.get('/api/users', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users_with_store')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ success: true, users: data });

  } catch (error) {
    console.error('Erreur récupération utilisateurs:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Réinitialiser le mot de passe d'un utilisateur
app.post('/api/users/:id/reset-password', async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Le mot de passe est requis' });
    }

    const { error } = await supabase.auth.admin.updateUserById(id, {
      password
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ success: true, message: 'Mot de passe réinitialisé avec succès' });

  } catch (error) {
    console.error('Erreur réinitialisation mot de passe:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Routes pour les magasins
// Créer un magasin
app.post('/api/stores', async (req, res) => {
  try {
    const { name, city, address, phone, is_active = true } = req.body;

    if (!name || !city) {
      return res.status(400).json({ error: 'Le nom et la ville sont requis' });
    }

    const { data, error } = await supabase
      .from('stores')
      .insert([{ name, city, address, phone, is_active }])
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ success: true, store: data });

  } catch (error) {
    console.error('Erreur création magasin:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Lister tous les magasins
app.get('/api/stores', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ success: true,  stores: data });

  } catch (error) {
    console.error('Erreur récupération magasins:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Modifier un magasin
app.put('/api/stores/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Si le magasin est désactivé, désactiver tous les employés de ce magasin
    if (updates.is_active === false) {
      console.log(`🔴 Désactivation du magasin ${id} - Désactivation des employés...`);
      
      // Désactiver tous les utilisateurs du magasin
      const { error: usersError } = await supabase
        .from('users')
        .update({ is_active: false })
        .eq('store_id', id);

      if (usersError) {
        console.error('Erreur lors de la désactivation des utilisateurs:', usersError);
        return res.status(400).json({ error: `Erreur lors de la désactivation des utilisateurs: ${usersError.message}` });
      }

      // Désactiver tous les employés (team_members) du magasin
      const { error: employeesError } = await supabase
        .from('team_members')
        .update({ is_active: false })
        .eq('store_id', id);

      if (employeesError) {
        console.error('Erreur lors de la désactivation des employés:', employeesError);
        // Ne pas retourner d'erreur ici car la table team_members pourrait ne pas exister
        // ou la colonne is_active pourrait ne pas exister encore
        if (employeesError.message.includes('column "is_active" does not exist')) {
          console.log('⚠️ Colonne is_active non trouvée dans team_members - ignorée');
        }
      }

      console.log(`✅ Tous les employés du magasin ${id} ont été désactivés`);
    }

    // Mettre à jour le magasin
    const { error } = await supabase
      .from('stores')
      .update(updates)
      .eq('id', id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const message = updates.is_active === false 
      ? 'Magasin désactivé avec succès. Tous les employés de ce magasin ont également été désactivés.'
      : 'Magasin modifié avec succès';

    res.json({ success: true, message });

  } catch (error) {
    console.error('Erreur modification magasin:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Supprimer un magasin
app.delete('/api/stores/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier s'il y a des utilisateurs dans ce magasin
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id')
      .eq('store_id', id);

    if (usersError) {
      return res.status(400).json({ error: usersError.message });
    }

    if (users && users.length > 0) {
      return res.status(400).json({ 
        error: 'Impossible de supprimer ce magasin car il contient des utilisateurs' 
      });
    }

    const { error } = await supabase
      .from('stores')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ success: true, message: 'Magasin supprimé avec succès' });

  } catch (error) {
    console.error('Erreur suppression magasin:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Routes pour les employés (team_members)
// Créer un employé
app.post('/api/employees', async (req, res) => {
  try {
    const { 
      name, 
      role, 
      section,
      location, 
      phone, 
      email, 
      shift, 
      manager_id, 
      store_id,
      status = 'offline',
      rating = 5,
      performance = 0,
      tasks_completed = 0
    } = req.body;

    if (!name || !role || !section || !shift || !manager_id || !store_id) {
      return res.status(400).json({ 
        error: 'Les champs name, role, section, shift, manager_id et store_id sont requis' 
      });
    }

    // Vérifier que le magasin existe
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id')
      .eq('id', store_id)
      .single();

    if (storeError || !store) {
      return res.status(400).json({ error: 'Le magasin spécifié n\'existe pas' });
    }

    // Vérifier que le manager existe
    const { data: manager, error: managerError } = await supabase
      .from('users')
      .select('id')
      .eq('id', manager_id)
      .single();

    if (managerError || !manager) {
      return res.status(400).json({ error: 'Le manager spécifié n\'existe pas' });
    }

    const { data, error } = await supabase
      .from('team_members')
      .insert([{ 
        name, 
        role, 
        section,
        status,
        rating,
        location: location || null, 
        phone, 
        email, 
        shift, 
        performance,
        tasks_completed,
        manager_id, 
        store_id
      }])
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ success: true, employee: data });

  } catch (error) {
    console.error('Erreur création employé:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Lister tous les employés avec filtrage
app.get('/api/employees', async (req, res) => {
  try {
    const { store_id, section, manager_id } = req.query;

    // Vérifier si la table team_members existe, sinon retourner un tableau vide
    const { data: tableExists, error: tableError } = await supabase
      .from('team_members')
      .select('id')
      .limit(1);

    if (tableError && tableError.message.includes('does not exist')) {
      console.log('Table team_members n\'existe pas encore, retour d\'un tableau vide');
      return res.json({ success: true, employees: [] });
    }

    let query = supabase
      .from('team_members')
      .select('*');

    // Filtrer par magasin si spécifié
    if (store_id) {
      query = query.eq('store_id', store_id);
    }

    // Filtrer par section si spécifiée
    if (section) {
      query = query.eq('section', section);
    }

    // Filtrer par manager si spécifié
    if (manager_id) {
      query = query.eq('manager_id', manager_id);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ success: true, employees: data || [] });

  } catch (error) {
    console.error('Erreur récupération employés:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Modifier un employé
app.put('/api/employees/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Vérifier que le magasin existe si fourni
    if (updates.store_id) {
      const { data: store, error: storeError } = await supabase
        .from('stores')
        .select('id')
        .eq('id', updates.store_id)
        .single();

      if (storeError || !store) {
        return res.status(400).json({ error: 'Le magasin spécifié n\'existe pas' });
      }
    }

    // Vérifier que le manager existe si fourni
    if (updates.manager_id) {
      const { data: manager, error: managerError } = await supabase
        .from('users')
        .select('id')
        .eq('id', updates.manager_id)
        .single();

      if (managerError || !manager) {
        return res.status(400).json({ error: 'Le manager spécifié n\'existe pas' });
      }
    }

    const { error } = await supabase
      .from('team_members')
      .update(updates)
      .eq('id', id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ success: true, message: 'Employé modifié avec succès' });

  } catch (error) {
    console.error('Erreur modification employé:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Supprimer un employé
app.delete('/api/employees/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ success: true, message: 'Employé supprimé avec succès' });

  } catch (error) {
    console.error('Erreur suppression employé:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// =====================================================
// ROUTES POUR LES PAUSES DES EMPLOYÉS
// =====================================================

// Créer une pause pour un employé
app.post('/api/employees/:id/breaks', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      start_time, 
      end_time, 
      date, 
      break_type = 'pause',
      description,
      is_recurring = false,
      recurrence_pattern = {}
    } = req.body;

    if (!start_time || !end_time || !date) {
      return res.status(400).json({ 
        error: 'Les champs start_time, end_time et date sont requis' 
      });
    }

    // Vérifier que l'employé existe
    const { data: employee, error: employeeError } = await supabase
      .from('team_members')
      .select('id')
      .eq('id', id)
      .single();

    if (employeeError || !employee) {
      return res.status(400).json({ error: 'L\'employé spécifié n\'existe pas' });
    }

    // Vérifier que l'heure de fin est après l'heure de début
    if (start_time >= end_time) {
      return res.status(400).json({ error: 'L\'heure de fin doit être après l\'heure de début' });
    }

    const { data, error } = await supabase
      .from('employee_breaks')
      .insert([{ 
        employee_id: id,
        start_time, 
        end_time, 
        date, 
        break_type,
        description,
        is_recurring,
        recurrence_pattern
      }])
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ success: true, break: data });

  } catch (error) {
    console.error('Erreur création pause:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Lister les pauses d'un employé
app.get('/api/employees/:id/breaks', async (req, res) => {
  try {
    const { id } = req.params;
    const { date, start_date, end_date } = req.query;

    // Vérifier que l'employé existe
    const { data: employee, error: employeeError } = await supabase
      .from('team_members')
      .select('id')
      .eq('id', id)
      .single();

    if (employeeError || !employee) {
      return res.status(400).json({ error: 'L\'employé spécifié n\'existe pas' });
    }

    let query = supabase
      .from('employee_breaks_with_duration')
      .select('*')
      .eq('employee_id', id)
      .eq('is_active', true)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true });

    // Filtrer par date spécifique
    if (date) {
      query = query.eq('date', date);
    }

    // Filtrer par plage de dates
    if (start_date && end_date) {
      query = query.gte('date', start_date).lte('date', end_date);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ success: true, breaks: data || [] });

  } catch (error) {
    console.error('Erreur récupération pauses:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Modifier une pause
app.put('/api/breaks/:breakId', async (req, res) => {
  try {
    const { breakId } = req.params;
    const updates = req.body;

    // Vérifier que la pause existe
    const { data: existingBreak, error: breakError } = await supabase
      .from('employee_breaks')
      .select('*')
      .eq('id', breakId)
      .single();

    if (breakError || !existingBreak) {
      return res.status(400).json({ error: 'La pause spécifiée n\'existe pas' });
    }

    // Vérifier que l'heure de fin est après l'heure de début si les deux sont fournies
    if (updates.start_time && updates.end_time && updates.start_time >= updates.end_time) {
      return res.status(400).json({ error: 'L\'heure de fin doit être après l\'heure de début' });
    }

    const { data, error } = await supabase
      .from('employee_breaks')
      .update(updates)
      .eq('id', breakId)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ success: true, break: data });

  } catch (error) {
    console.error('Erreur modification pause:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Supprimer une pause
app.delete('/api/breaks/:breakId', async (req, res) => {
  try {
    const { breakId } = req.params;

    // Vérifier que la pause existe
    const { data: existingBreak, error: breakError } = await supabase
      .from('employee_breaks')
      .select('id')
      .eq('id', breakId)
      .single();

    if (breakError || !existingBreak) {
      return res.status(400).json({ error: 'La pause spécifiée n\'existe pas' });
    }

    const { error } = await supabase
      .from('employee_breaks')
      .delete()
      .eq('id', breakId);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ success: true, message: 'Pause supprimée avec succès' });

  } catch (error) {
    console.error('Erreur suppression pause:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Récupérer toutes les pauses pour une date donnée (pour le planning)
app.get('/api/breaks/date/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const { manager_id, section } = req.query;

    let query = supabase
      .from('employee_breaks_with_duration')
      .select('*')
      .eq('date', date)
      .eq('is_active', true)
      .order('start_time', { ascending: true });

    // Filtrer par manager si spécifié
    if (manager_id) {
      query = query.eq('employee_section', manager_id);
    }

    // Filtrer par section si spécifiée
    if (section) {
      query = query.eq('employee_section', section);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ success: true, breaks: data || [] });

  } catch (error) {
    console.error('Erreur récupération pauses par date:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur API démarré sur http://localhost:${PORT}`);
  console.log(`📋 Routes disponibles :`);
  console.log(`   GET  /api/health`);
  console.log(`   POST /api/users`);
  console.log(`   PUT  /api/users/:id`);
  console.log(`   DELETE /api/users/:id`);
  console.log(`   GET  /api/users`);
  console.log(`   POST /api/users/:id/reset-password`);
  console.log(`   POST /api/stores`);
  console.log(`   GET  /api/stores`);
  console.log(`   PUT  /api/stores/:id`);
  console.log(`   DELETE /api/stores/:id`);
  console.log(`   POST /api/employees`);
  console.log(`   GET  /api/employees`);
  console.log(`   PUT  /api/employees/:id`);
  console.log(`   DELETE /api/employees/:id`);
  console.log(`   POST /api/employees/:id/breaks`);
  console.log(`   GET  /api/employees/:id/breaks`);
  console.log(`   PUT  /api/breaks/:breakId`);
  console.log(`   DELETE /api/breaks/:breakId`);
  console.log(`   GET  /api/breaks/date/:date`);
});

module.exports = app; 