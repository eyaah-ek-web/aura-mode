

const SUPABASE_URL = 'https://inrrahsuukrqjqolqlzp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlucnJhaHN1dWtycWpxb2xxbHpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxMTI1NTQsImV4cCI6MjA5MjY4ODU1NH0.4dVojic-UIievyGoeBi7uDNixx_z8LkJ9fihkyTV_zI';

// Initialiser le client Supabase (via CDN, pas besoin de npm)
const { createClient } = supabase;
const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── AUTH FUNCTIONS ──

/**
 * Inscription avec email + password
 * @param {string} email
 * @param {string} password
 * @param {string} prenom
 * @param {string} style  — 'casual' | 'chic' | 'boheme' | 'sportif'
 */
async function authSignUp(email, password, prenom, style) {
    const { data, error } = await _supabase.auth.signUp({
        email,
        password,
        options: {
            data: { prenom, style }
        }
    });
    if (error) throw error;
    return data;
}

/**
 * Connexion avec email + password
 */
async function authSignIn(email, password) {
    const { data, error } = await _supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
}

/**
 * Déconnexion
 */
async function authSignOut() {
    await _supabase.auth.signOut();
    window.location.href = 'index.html';
}

/**
 * Récupérer la session courante
 * Retourne null si non connecté
 */
async function getSession() {
    const { data: { session } } = await _supabase.auth.getSession();
    return session;
}

/**
 * Récupérer l'utilisateur courant
 * Retourne null si non connecté
 */
async function getCurrentUser() {
    const session = await getSession();
    return session ? session.user : null;
}

/**
 * Protéger une page — à appeler en haut de chaque page authentifiée
 * Redirige vers index.html si non connecté
 */
async function requireAuth() {
    const user = await getCurrentUser();
    if (!user) {
        window.location.href = 'index.html';
        return null;
    }
    return user;
}

/**
 * Récupérer le prénom depuis les metadata
 */
function getUserPrenom(user) {
    return user?.user_metadata?.prenom || user?.email?.split('@')[0] || 'Toi';
}