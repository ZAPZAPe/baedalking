'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaHome, FaTrophy, FaUpload, FaUser } from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContext';

const BottomNavigation = () => {
  const pathname = usePathname();
  const { user } = useAuth();

  const navItems = [
    { 
      href: '/', 
      icon: <FaHome size={20} />, 
      label: '홈',
      isActive: pathname === '/'
    },
    { 
      href: '/ranking', 
      icon: <FaTrophy size={20} />, 
      label: '랭킹',
      isActive: pathname === '/ranking'
    },
    { 
      href: '/upload', 
      icon: <FaUpload size={20} />, 
      label: '업로드',
      isActive: pathname === '/upload'
    },
    { 
      href: user ? '/settings' : '/login', 
      icon: <FaUser size={20} />, 
      label: user ? '설정' : '로그인',
      isActive: pathname === '/settings' || pathname === '/login'
    }
  ];

  return (
    <nav className="
      fixed bottom-0 left-0 right-0 z-50
      bg-white/95 backdrop-blur-lg
      border-t-2 border-gray-200
      shadow-lg safe-area-bottom
      py-2 px-4
      transition-all duration-200
    ">
      <div className="max-w-3xl mx-auto">
        <ul className="flex items-center justify-between">
          {navItems.map((item) => (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                prefetch={true}
                className={`
                  group relative flex flex-col items-center justify-center
                  py-2 px-3 rounded-lg
                  transition-all duration-200 ease-out
                  min-h-[2.75rem] thumb-zone
                  ${item.isActive 
                    ? 'bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-md transform scale-105' 
                    : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                  }
                `}
              >
                
                {/* Icon */}
                <div className={`
                  mb-1 transform transition-transform duration-200
                  ${item.isActive ? 'scale-110' : 'group-hover:scale-105'}
                `}>
                  {item.icon}
                </div>
                
                {/* Label */}
                <span className={`
                  text-xs font-semibold leading-tight text-center
                  transition-all duration-200
                  ${item.isActive ? 'text-white' : 'text-gray-700 group-hover:text-blue-600'}
                `}>
                  {item.label}
                </span>
                
                {/* Active indicator dot */}
                {item.isActive && (
                  <div className="absolute -top-1 left-1/2 transform -translate-x-1/2">
                    <div className="w-1 h-1 bg-yellow-300 rounded-full"></div>
                  </div>
                )}
                
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

export default BottomNavigation; 