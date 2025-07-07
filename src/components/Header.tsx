
import React from 'react';
import { BookOpen, User, Calendar, FileText, LayoutDashboard, LogOut, BarChart3, Upload, LogIn, UserPlus, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import logo from "../../public/study.png";
interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  user?: { name: string; email: string } | null;

  onLogout?: () => void;
  isLoggedIn: boolean;
}

const Header = ({ activeTab, onTabChange, user, onLogout, isLoggedIn }: HeaderProps) => {
  // Navigation for logged-in users
  const loggedInNavigation = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'notes', label: 'Notes', icon: FileText },
    { id: 'planner', label: 'Planner', icon: Calendar },
    //{ id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'resources', label: 'Resources', icon: Upload },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  // Navigation for non-logged-in users
  const guestNavigation = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'features', label: 'Features', icon: LayoutDashboard },
    { id: 'login', label: 'Login', icon: LogIn },
    { id: 'signup', label: 'Sign Up', icon: UserPlus },
  ];

  const navigation = isLoggedIn ? loggedInNavigation : guestNavigation;

  const handleFeatures = () => {
    // Scroll to features section on home page
    onTabChange('home');
    setTimeout(() => {
      const featuresSection = document.querySelector('[data-features]');
      if (featuresSection) {
        featuresSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  return (
    <header className="bg-white/80 backdrop-blur-lg border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <button onClick={() => onTabChange('home')} className="flex items-center space-x-3">
              <div className="w-9 h-10 rounded-xl flex items-center justify-center">
                <img src={logo} alt="StudySync Logo" className="w-10 h-10 object-contain" />
              </div>

              <div>
                <h1 className="text-xl font-bold text-[#89A8B2]">
                  StudySync
                </h1>
              </div>

            </button>
          </div>


          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id ||
                (item.id === 'features' && activeTab === 'home' && !isLoggedIn);

              return (
                <button
                  key={item.id}
                  onClick={item.id === 'features' ? handleFeatures : () => onTabChange(item.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-3">
            {isLoggedIn && user ? (
              <>
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-foreground">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onLogout}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <div className="hidden md:flex items-center space-x-2">
                <Button
                  size="sm"
                  onClick={() => onTabChange('login')}
                  className="border-0 text-white bg-[#C599B6] hover:bg-[#E6B2BA] transition duration-200"
                >
                  Login
                </Button>

                <Button
                  size="sm"
                  onClick={() => onTabChange('signup')}
                  className="border-0 text-white bg-[#C599B6] hover:bg-[#E6B2BA] transition duration-200"
                >
                  Sign Up
                </Button>
              </div>

            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-border bg-white/50">
          {navigation.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id ||
              (item.id === 'features' && activeTab === 'home' && !isLoggedIn);

            return (
              <button
                key={item.id}
                onClick={item.id === 'features' ? handleFeatures : () => onTabChange(item.id)}
                className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-all duration-200 ${isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};

export default Header;
