declare module 'jspdf';
declare module 'html2canvas';
declare module 'react-icons/fa';
declare module '*.png' {
  const content: { src: string; height: number; width: number };
  export default content;
}
