import type { Metadata,Viewport } from 'next';
import '@fontsource-variable/dm-sans/wght.css';
import './globals.css';
import './playful.css';
export const metadata:Metadata={title:'Shared Money — samen delen, zonder gedoe',description:'Houd gezamenlijke uitgaven eenvoudig bij. Eerlijke verdelingen, heldere saldi en geen verplichte login.',manifest:'/manifest.webmanifest',icons:{icon:'/icon.svg',apple:'/icon-192.png'},appleWebApp:{capable:true,statusBarStyle:'default',title:'Shared Money'}};
export const viewport:Viewport={width:'device-width',initialScale:1,themeColor:'#f7f6fb'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="nl"><body>{children}</body></html>;}
