import React, { useState, useEffect } from 'react';
import { useApp } from '../services/store';
import { LucideIcon, Menu, Calendar, Users, UserCircle, Home as HomeIcon, X, Bell, Building2, CheckCircle, AlertCircle, Info, Image as ImageIcon, Upload, Library, Coffee, Share2, Laptop, Loader2 } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

// --- COLORS ---
// Primary: text-primary-800, bg-primary-800 (Petrol)
// Background: bg-stone-50 (Beige)

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', size = 'md', className = '', ...props }) => {
  const baseStyle = "rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center";
  
  const variants = {
    primary: "bg-primary-800 text-white hover:bg-primary-900 focus:ring-primary-800",
    secondary: "bg-stone-200 text-stone-800 hover:bg-stone-300 focus:ring-stone-400",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-600",
    ghost: "bg-transparent text-primary-800 hover:bg-stone-100"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2",
    lg: "px-6 py-3 text-lg"
  };

  return (
    <button className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export const Card: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void }> = ({ children, className = '', onClick }) => (
  <div 
    className={`bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''} ${className}`}
    onClick={onClick}
  >
    {children}
  </div>
);

export const Badge: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color = 'bg-stone-200 text-stone-800' }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
    {children}
  </span>
);

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string }> = ({ label, className = '', ...props }) => (
  <div className="mb-4">
    {label && <label className="block text-sm font-medium text-stone-700 mb-1">{label}</label>}
    <input 
      className={`w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent bg-white text-stone-900 ${className}`}
      {...props}
    />
  </div>
);

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }> = ({ label, className = '', children, ...props }) => (
  <div className="mb-4">
    {label && <label className="block text-sm font-medium text-stone-700 mb-1">{label}</label>}
    <select 
      className={`w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent bg-white text-stone-900 ${className}`}
      {...props}
    >
      {children}
    </select>
  </div>
);

// --- IMAGE UPLOAD COMPONENT ---
interface ImageUploadProps {
  label?: string;
  currentImage?: string;
  onImageSelected: (url: string) => void;
  className?: string;
  circular?: boolean;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ label, currentImage, onImageSelected, className = '', circular = false }) => {
  const [preview, setPreview] = useState<string | undefined>(currentImage);
  const [uploading, setUploading] = useState(false);
  const { uploadFile } = useApp();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Local Preview
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);

    // Upload
    setUploading(true);
    const url = await uploadFile(file);
    setUploading(false);

    if (url) {
        onImageSelected(url);
    }
  };

  return (
    <div className={`mb-4 ${className}`}>
      {label && <label className="block text-sm font-medium text-stone-700 mb-2">{label}</label>}
      <div className="flex items-center gap-4">
        <div 
          className={`relative overflow-hidden bg-stone-100 border border-stone-300 flex items-center justify-center shrink-0 ${circular ? 'w-24 h-24 rounded-full' : 'w-32 h-24 rounded-lg'}`}
        >
          {uploading ? (
            <Loader2 size={32} className="animate-spin text-primary-600" />
          ) : preview ? (
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <ImageIcon className="text-stone-400" size={32} />
          )}
        </div>
        <div className="flex-1">
           <label className={`cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 text-sm font-medium text-stone-700 transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
             <Upload size={16} />
             {uploading ? 'Wird hochgeladen...' : 'Bild hochladen'}
             <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} disabled={uploading} />
           </label>
           <p className="text-xs text-stone-500 mt-2">JPG, PNG bis 5MB.</p>
        </div>
      </div>
    </div>
  );
};

// --- ONBOARDING MODAL ---
export const OnboardingModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [slide, setSlide] = useState(0);
  const slides = [
    { title: "Willkommen im Begegnungscafé", text: "Dein Ort für Austausch, Bildung und Spiritualität in Nürnberg." },
    { title: "Events & Anmeldung", text: "Finde spannende Veranstaltungen und melde dich mit einem Klick an." },
    { title: "Gruppen & Mentoring", text: "Vernetze dich in Themengruppen oder nutze das Mentoring-Programm." },
    { title: "Du hast die Kontrolle", text: "Verwalte deine Benachrichtigungen und Daten ganz einfach." }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-8 flex flex-col items-center text-center">
        <h2 className="text-2xl font-bold text-primary-800 mb-4">{slides[slide].title}</h2>
        <p className="text-stone-600 mb-8 text-lg">{slides[slide].text}</p>
        
        <div className="flex gap-2 mb-8">
          {slides.map((_, i) => (
            <div key={i} className={`h-2 w-2 rounded-full ${i === slide ? 'bg-primary-800' : 'bg-stone-300'}`} />
          ))}
        </div>

        <div className="flex w-full gap-4">
           {slide > 0 && (
             <Button variant="secondary" onClick={() => setSlide(s => s - 1)} className="flex-1">Zurück</Button>
           )}
           <Button 
             onClick={() => {
               if (slide < slides.length - 1) setSlide(s => s + 1);
               else onClose();
             }} 
             className="flex-1"
           >
             {slide === slides.length - 1 ? "Starten" : "Weiter"}
           </Button>
        </div>
      </div>
    </div>
  );
};

// --- NOTIFICATION TOAST ---
export const ToastContainer: React.FC = () => {
  const { notifications, removeNotification } = useApp();

  return (
    <div className="fixed top-4 left-0 right-0 z-[60] flex flex-col items-center gap-2 pointer-events-none px-4">
      {notifications.map((note) => {
        const icons = {
          info: <Info size={20} className="text-blue-500" />,
          success: <CheckCircle size={20} className="text-green-500" />,
          warning: <AlertCircle size={20} className="text-orange-500" />
        };
        
        const borderColors = {
          info: 'border-blue-100',
          success: 'border-green-100',
          warning: 'border-orange-100'
        };

        return (
          <div 
            key={note.id} 
            className={`pointer-events-auto bg-white rounded-xl shadow-lg p-3 border ${borderColors[note.type]} flex items-start gap-3 w-full max-w-sm animate-in slide-in-from-top-5 fade-in duration-300`}
          >
            <div className="mt-0.5 shrink-0">{icons[note.type]}</div>
            <div className="flex-1">
              <h4 className="font-bold text-sm text-stone-900">{note.title}</h4>
              <p className="text-xs text-stone-500 leading-snug">{note.message}</p>
            </div>
            <button onClick={() => removeNotification(note.id)} className="text-stone-400 hover:text-stone-600">
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
};

// --- ICON MAPPING ---
export const ICON_MAP: Record<string, LucideIcon> = {
  Home: HomeIcon,
  Coffee: Coffee,
  Laptop: Laptop,
  Calendar: Calendar,
  Library: Library,
  Users: Users,
  UserCircle: UserCircle
};

// --- LAYOUT ---

interface NavItemProps {
  to: string;
  iconName: string;
  label: string;
  isActive: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ to, iconName, label, isActive }) => {
  const Icon = ICON_MAP[iconName] || HomeIcon;
  
  return (
    <Link to={to} className={`flex flex-col items-center justify-center w-full py-2 ${isActive ? 'text-primary-800' : 'text-stone-400'}`}>
      <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
      <span className="text-[10px] mt-1 font-medium">{label}</span>
    </Link>
  );
};

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, announcements, appConfig } = useApp();
  const location = useLocation();
  const canManageRooms = currentUser?.role === 'organizer' || currentUser?.role === 'admin';

  // Navigation items from config + fixed items
  const visibleNavItems = appConfig.navigation.filter(item => item.isVisible).sort((a, b) => a.order - b.order);

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans pb-20 md:pb-0">
      <ToastContainer />
      
      {/* Desktop Header */}
      <header className="hidden md:flex items-center justify-between px-8 py-4 bg-white shadow-sm border-b border-stone-200 sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-primary-800 rounded-full flex items-center justify-center text-white font-bold">B</div>
          <h1 className="text-xl font-bold text-primary-900">Begegnungscafé</h1>
        </div>
        <nav className="flex gap-8">
          {visibleNavItems.map(item => (
             <Link key={item.id} to={item.path} className="hover:text-primary-800 font-medium">{item.label}</Link>
          ))}
          
          {canManageRooms && <Link to="/rooms" className="hover:text-primary-800 font-medium">Räume</Link>}
          {currentUser?.role === 'admin' && <Link to="/admin" className="hover:text-primary-800 font-medium">Admin</Link>}
        </nav>
        <Link to="/profile">
          {currentUser?.avatarUrl ? (
             <img src={currentUser.avatarUrl} alt="Profile" className="h-10 w-10 rounded-full object-cover border border-stone-200 hover:ring-2 ring-primary-200" />
          ) : (
            <div className="h-10 w-10 rounded-full bg-stone-200 flex items-center justify-center text-stone-600 hover:bg-primary-100 transition-colors">
              <UserCircle size={24} />
            </div>
          )}
        </Link>
      </header>

      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-stone-200 sticky top-0 z-20">
        <h1 className="text-lg font-bold text-primary-900">Begegnungscafé</h1>
        {currentUser && (
           <div className="relative">
             <Bell size={20} className="text-stone-600" />
             {announcements.length > 0 && <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full" />}
           </div>
        )}
      </header>

      <main className="max-w-5xl mx-auto p-4 md:p-8">
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 flex justify-around items-center pb-safe z-30 h-16">
        {visibleNavItems.slice(0, 5).map(item => (
           <NavItem key={item.id} to={item.path} iconName={item.icon} label={item.label} isActive={location.pathname === item.path} />
        ))}
        <NavItem to="/profile" iconName="UserCircle" label="Profil" isActive={location.pathname === '/profile'} />
      </nav>
    </div>
  );
};
