<div align="center">

![Wouaff Banner](https://raw.githubusercontent.com/youtsuhodev/wouaff-navigator/main/assets/logo/logo.png)

# 🐾 Wouaff

### Navigateur Internet basé sur Chromium & Electron

[![GitHub Stars](https://img.shields.io/github/stars/youtsuhodev/wouaff-navigator?style=flat-square&color=FF7A3B&label=Stars)](https://github.com/youtsuhodev/wouaff-navigator/stargazers)
[![GitHub Forks](https://img.shields.io/github/forks/youtsuhodev/wouaff-navigator?style=flat-square&color=3B82F6&label=Forks)](https://github.com/youtsuhodev/wouaff-navigator/network/members)
[![GitHub Issues](https://img.shields.io/github/issues/youtsuhodev/wouaff-navigator?style=flat-square&color=EF4444&label=Issues)](https://github.com/youtsuhodev/wouaff-navigator/issues)
[![License](https://img.shields.io/badge/license-proprietary-red?style=flat-square)](LICENSE)
[![Electron](https://img.shields.io/badge/Electron-42-47848F?style=flat-square&logo=electron&logoColor=white)](https://electronjs.org/)
[![Chromium](https://img.shields.io/badge/Chromium-powered-4285F4?style=flat-square&logo=googlechrome&logoColor=white)](https://www.chromium.org/)

![Wouaff Preview](https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png)

<br/>

**Un navigateur web moderne, rapide et respectueux de votre vie privée.**
**Multi-onglets, favoris, mise à jour automatique et Discord RPC intégré.**

[📥 Télécharger](https://github.com/youtsuhodev/wouaff-navigator/releases/latest) · [🐛 Signaler un bug](https://github.com/youtsuhodev/wouaff-navigator/issues) · [💡 Suggérer une feature](https://github.com/youtsuhodev/wouaff-navigator/issues)

<br/>

![Browser Animation](https://user-images.githubusercontent.com/251450/197446767-c8f79e0e-9673-4300-b52a-4d68b0660d64.gif)

</div>

---

## ✨ Caractéristiques

<table>
<tr>
<td width="50%">

### 🎨 Interface Moderne
- Design sleek avec thème sombre & clair
- Barre d'onglets avec navigation rapide
- Fenêtre sans bordure (frameless)
- Animations fluides et transition douces

</td>
<td width="50%">

### 🔖 Gestion des Favoris
- Barre de favoris toujours accessible
- Ajout/suppression en un clic
- Menu débordement intelligent
- Synchronisation locale sécurisée

</td>
</tr>
<tr>
<td width="50%">

### ⚙️ Paramètres Avancés
- Choix du moteur de recherche
- Page d'accueil personnalisable
- Zoom par onglet
- Barre de favoris activable/désactivable

</td>
<td width="50%">

### 🔄 Mise à Jour Automatique
- Détection automatique des nouvelles versions
- Pop-up elegante avec progression
- Téléchargement en arrière-plan
- Installation en un clic

</td>
</tr>
<tr>
<td width="50%">

### 🎮 Discord RPC
- Affichez votre activité de navigation
- Titre de la page en temps réel
- Statut "Navigue sur..."
- Intégration native avec Discord

</td>
<td width="50%">

### 🛡️ Sécurité & Vie Privée
- Protection anti-tracking intégrée
- Blocage des cookies tiers
- Pas de télémétrie
- Open source et auditable

</td>
</tr>
</table>

---

## 📸 Captures d'écran

<div align="center">

![Page d'accueil](https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&h=400&fit=crop)

*Page d'accueil avec barre de recherche et liens rapides*

</div>

---

## 🚀 Installation

### Prérequis

- **Windows** 10/11 (64-bit)
- **4 Go** de RAM minimum
- **200 Mo** d'espace disque

### Téléchargement

```bash
# Télécharger la dernière version
https://github.com/youtsuhodev/wouaff-navigator/releases/latest

# Ou cloner et builder manuellement
git clone https://github.com/youtsuhodev/wouaff-navigator.git
cd wouaff-navigator
npm install
npm run build
```

### Utilisation

1. **Installer** le fichier `Wouaff Setup x.x.x.exe`
2. **Lancer** Wouaff depuis le raccourci Bureau ou Menu Démarrer
3. **Naviguez** en toute sécurité !

---

## 🛠️ Stack Technique

<div align="center">

![Electron](https://img.shields.io/badge/Electron-42-47848F?style=for-the-badge&logo=electron&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=for-the-badge&logo=node.js&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES2024-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![Bootstrap Icons](https://img.shields.io/badge/Bootstrap_Icons-1.13.1-7952B3?style=for-the-badge&logo=bootstrap&logoColor=white)
![Discord RPC](https://img.shields.io/badge/Discord_RPC-5865F2?style=for-the-badge&logo=discord&logoColor=white)

</div>

---

## 📁 Structure du Projet

```
wouaff-navigator/
├── main.js              # Point d'entrée Electron
├── preload.js           # Script de préchargement (IPC)
├── rpc.js               # Intégration Discord RPC
├── package.json         # Configuration et dépendances
├── assets/
│   ├── css/
│   │   └── app.css      # Styles globaux
│   └── logo/
│       ├── logo.png     # Logo Wouaff
│       └── icon.ico     # Icône Windows
├── renderer/
│   ├── index.html       # Page principale
│   ├── app.js           # Logique de l'application
│   └── style.css        # Styles de l'interface
└── LICENSE              # Licence propriétaire
```

---

## 🎯 Fonctionnalités en Détail

### 🌐 Navigation
| Raccourci | Action |
|-----------|--------|
| `Ctrl+T` | Nouvel onglet |
| `Ctrl+W` | Fermer l'onglet |
| `Ctrl+R` | Recharger la page |
| `Ctrl+Shift+R` | Recharger (sans cache) |
| `F12` | Outils de développement |
| `Ctrl+=` | Zoom avant |
| `Ctrl+-` | Zoom arrière |
| `Ctrl+0` | Zoom normal |
| `Ctrl+[` | Page précédente |
| `Ctrl+]` | Page suivante |

### 🔍 Moteurs de Recherche Supportés

- **Wouaff** (Qwant) - Par défaut
- **Google**
- **Bing**
- **DuckDuckGo**
- **Personnalisé** (URL au choix)

---

## 🤝 Contribuer

Les contributions sont les bienvenues !

```bash
# Fork le projet
git clone https://github.com/VOTRE_USERNAME/wouaff-navigator.git

# Créer une branche
git checkout -b feature/ma-feature

# Commit
git commit -m "Ajout de ma feature"

# Push
git push origin feature/ma-feature

# Ouvrir une Pull Request
```

Voir [CONTRIBUTING.md](CONTRIBUTING.md) pour plus de détails.

---

## 📄 Licence

Ce projet est soumis à une licence propriétaire. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

**Règles principales :**
- ✅ Contributions au projet autorisées
- ❌ Usage commercial interdit sans accord
- ❌ Usage personnel sans accord interdit

---

## 🙏 Remerciements

- [Electron](https://electronjs.org/) - Framework desktop
- [Chromium](https://www.chromium.org/) - Moteur de rendu web
- [Bootstrap Icons](https://icons.getbootstrap.com/) - Icônes
- [Discord RPC](https://github.com/xhayper/discord-rpc) - Intégration Discord

---

## 📊 Statistiques

<div align="center">

![GitHub Stats](https://github-readme-stats.vercel.app/api?username=youtsuhodev&show_icons=true&theme=dark&hide_border=true&bg_color=0d1117&title_color=FF7A3B&icon_color=FF7A3B)

![Top Langues](https://github-readme-stats.vercel.app/api/top-langs/?username=youtsuhodev&layout=compact&theme=dark&hide_border=true&bg_color=0d1117&title_color=FF7A3B)

</div>

---

<div align="center">

**Fait avec ❤️ par [Wouaff Team](https://github.com/youtsuhodev)**

![Footer](https://komarev.com/ghpvc/?username=youtsuhodev&color=FF7A3B&style=flat-square&label=Profile+Visitors)

</div>
