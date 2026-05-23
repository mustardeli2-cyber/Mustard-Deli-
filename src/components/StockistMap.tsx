import React, { useState } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow, useAdvancedMarkerRef } from '@vis.gl/react-google-maps';
import { STOCKISTS, Stockist } from '../constants';
import { MapPin, Navigation, ExternalLink, Store } from 'lucide-react';

const API_KEY = (import.meta as any).env.VITE_GOOGLE_MAPS_PLATFORM_KEY || '';

function StockistMarker({ stockist }: { stockist: Stockist }) {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const [infoWindowShown, setInfoWindowShown] = useState(false);

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={{ lat: stockist.lat, lng: stockist.lng }}
        title={stockist.name}
        onClick={() => setInfoWindowShown(true)}
      >
        <Pin 
          background={stockist.type === 'Retailer' ? '#A3A31F' : '#4B5320'} 
          glyphColor="#fff" 
          borderColor="#000"
        />
      </AdvancedMarker>

      {infoWindowShown && (
        <InfoWindow
          anchor={marker}
          onCloseClick={() => setInfoWindowShown(false)}
        >
          <div className="p-2 min-w-[200px]">
            <h4 className="text-sm font-black text-brand-dark uppercase mb-1">{stockist.name}</h4>
            <p className="text-[10px] text-brand-dark/60 font-medium mb-3">
              {stockist.location}, {stockist.city}
            </p>
            <div className="flex items-center gap-2">
              <a 
                href={`https://www.google.com/maps/dir/?api=1&destination=${stockist.lat},${stockist.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-brand-dark text-white text-[9px] font-bold py-2 px-3 flex items-center justify-center gap-2 hover:bg-brand-accent transition-colors"
              >
                <Navigation className="w-3 h-3" />
                GET DIRECTIONS
              </a>
              {stockist.website && (
                <a 
                  href={stockist.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-brand-secondary border border-brand-border p-2 hover:bg-white transition-colors"
                >
                  <ExternalLink className="w-3 h-3 text-brand-dark" />
                </a>
              )}
            </div>
          </div>
        </InfoWindow>
      )}
    </>
  );
}

export default function StockistMap() {
  const [activeTab, setActiveTab] = useState<'Western Cape' | 'Gauteng' | 'Eastern Cape' | 'KwaZulu-Natal' | 'Other'>('Western Cape');

  const provinces = ['Western Cape', 'Gauteng', 'Eastern Cape', 'KwaZulu-Natal'];
  
  const filteredStockists = STOCKISTS.filter(s => {
    if (activeTab === 'Other') return !provinces.includes(s.province);
    return s.province === activeTab;
  });

  const defaultCenter = filteredStockists.length > 0 
    ? { lat: filteredStockists[0].lat, lng: filteredStockists[0].lng }
    : { lat: -33.9249, lng: 18.4241 }; // Cape Town default

  if (!API_KEY) {
    return (
      <div className="bg-brand-secondary border border-brand-border p-12 text-center">
        <MapPin className="w-8 h-8 text-brand-dark/20 mx-auto mb-4" />
        <h3 className="text-xs font-black text-brand-dark uppercase tracking-widest">Map Configuration Required</h3>
        <p className="text-[10px] text-brand-dark/60 mt-2 max-w-xs mx-auto">
          Add GOOGLE_MAPS_PLATFORM_KEY to Secrets to enable the interactive Stockist Map.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-brand-border overflow-hidden">
      <div className="flex border-b border-brand-border bg-brand-secondary p-1 overflow-x-auto no-scrollbar">
        {[...provinces, 'Other'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`whitespace-nowrap px-4 py-3 text-[9px] font-black uppercase tracking-widest transition-all ${
              activeTab === tab 
                ? 'bg-brand-dark text-white' 
                : 'text-brand-dark hover:bg-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="h-[500px] w-full relative">
        <APIProvider apiKey={API_KEY} version="weekly">
          <Map
            defaultCenter={defaultCenter}
            defaultZoom={7}
            mapId="MUSTARD_STOCKIST_MAP"
            gestureHandling={'greedy'}
            disableDefaultUI={false}
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            style={{ width: '100%', height: '100%' }}
          >
            {filteredStockists.map(stockist => (
              <StockistMarker key={stockist.id} stockist={stockist} />
            ))}
          </Map>
        </APIProvider>

        {/* Legend Overlay */}
        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur border border-brand-border p-3 pointer-events-none">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-3 h-3 bg-[#A3A31F] rounded-full border border-black/20" />
            <span className="text-[9px] font-black text-brand-dark uppercase">Artisan Retailer</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-[#4B5320] rounded-full border border-black/20" />
            <span className="text-[9px] font-black text-brand-dark uppercase">Regional Market</span>
          </div>
        </div>
      </div>
    </div>
  );
}
