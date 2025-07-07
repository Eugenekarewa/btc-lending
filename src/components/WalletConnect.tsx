import React, { useState } from 'react';
import { Shield, Globe, Facebook, Twitch } from 'lucide-react';

interface Provider {
  id: string;
  name: string;
  icon: React.ComponentType<{ size?: number }>;
  color: string;
  hoverColor: string;
}

interface WalletConnectProps {
  onConnect: (walletData: {
    address: string;
    provider: string;
    balance: number;
  }) => void;
}

const WalletConnect: React.FC<WalletConnectProps> = ({ onConnect }) => {
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);

  const providers: Provider[] = [
    {
      id: 'google',
      name: 'Google',
      icon: Globe,
      color: 'btn-primary',
      hoverColor: 'hover:bg-red-600',
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: Facebook,
      color: 'btn-primary',
      hoverColor: 'hover:bg-blue-700',
    },
    {
      id: 'twitch',
      name: 'Twitch',
      icon: Twitch,
      color: 'btn-primary',
      hoverColor: 'hover:bg-purple-600',
    },
  ];

  const handleConnect = async (provider: Provider) => {
    setIsConnecting(true);
    setSelectedProvider(provider.id);

    try {
      // Simulate zkLogin flow
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simulate successful connection
      const mockWalletData = {
        address: '0x' + Math.random().toString(16).substr(2, 40),
        provider: provider.name,
        balance: Math.random() * 1000000, // Random SUI balance
      };

      onConnect(mockWalletData);
    } catch (error) {
      console.error('Connection failed:', error);
    } finally {
      setIsConnecting(false);
      setSelectedProvider(null);
    }
  };

  return (
    <div className="card max-w-md mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-8">
        <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-fit">
          <Shield className="text-blue-600" size={32} />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Connect Your Wallet
        </h2>
        <p className="text-gray-600">
          Use zkLogin to connect securely with your existing accounts
        </p>
      </div>

      <div className="space-y-4">
        {providers.map((provider) => {
          const Icon = provider.icon;
          const isCurrentlyConnecting = isConnecting && selectedProvider === provider.id;

          return (
            <button
              key={provider.id}
              onClick={() => handleConnect(provider)}
              disabled={isConnecting}
              className={`btn font-medium transition-all duration-200 w-full flex items-center justify-center gap-3 px-6 py-3 rounded-lg text-white ${
                isCurrentlyConnecting ? 'btn-disabled' : provider.color + ' ' + provider.hoverColor
              }`}
            >
              {isCurrentlyConnecting ? (
                <>
                  <div className="spinner"></div>
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <Icon size={20} />
                  <span>Connect with {provider.name}</span>
                </>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Shield size={16} />
          <span>
            Your login is secured by zkLogin technology. No private keys needed.
          </span>
        </div>
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-800 mb-2">What is zkLogin?</h4>
        <p className="text-sm text-blue-600">
          zkLogin allows you to use your existing Web2 accounts (Google, Facebook, etc.) 
          to interact with Web3 applications without managing private keys.
        </p>
      </div>
    </div>
  );
};

export default WalletConnect;
