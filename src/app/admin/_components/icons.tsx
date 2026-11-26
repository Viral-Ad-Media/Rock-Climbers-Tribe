/** Small inline icons for the admin menu (drawn for this project). */
const base = { viewBox: "0 0 20 20", fill: "currentColor", "aria-hidden": true } as const;

export const Icons = {
  dashboard: (
    <svg {...base}><path d="M10 3a8 8 0 0 0-8 8c0 2 .7 3.8 2 5.2l1.4-1.4A6 6 0 1 1 16 11c0 1.5-.6 2.9-1.4 3.8l1.4 1.4A8 8 0 0 0 10 3Zm3.5 3.6-4.3 4.2a1.5 1.5 0 1 0 1.4 1.4l4.3-4.2-1.4-1.4Z" /></svg>
  ),
  posts: (
    <svg {...base}><path d="m14.3 2.3 3.4 3.4-9.4 9.4-4.3 1 1-4.3 9.3-9.5Zm-11.3 15h14v1.5H3v-1.5Z" /></svg>
  ),
  media: (
    <svg {...base}><path d="M3 4h14v12H3V4Zm1.5 1.5v7.2l3-3 2.5 2.5 2-2 3.5 3.5V5.5h-11Zm8 1.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Z" /></svg>
  ),
  pages: (
    <svg {...base}><path d="M5 2h7l4 4v12H5V2Zm1.5 1.5v13h8V7h-3.5V3.5H6.5Zm1.5 6h5V11H8V9.5Zm0 3h5V14H8v-1.5Z" /></svg>
  ),
  comments: (
    <svg {...base}><path d="M3 3h14v10H8l-4 4v-4H3V3Zm1.5 1.5v7h1v2l2-2h8v-7h-11Z" /></svg>
  ),
  seo: (
    <svg {...base}><path d="M3 15h2.5v2H3v-2Zm4-4h2.5v6H7v-6Zm4-3h2.5v9H11V8Zm4-5h2.5v14H15V3Z" /></svg>
  ),
  products: (
    <svg {...base}><path d="M10.6 2H17a1 1 0 0 1 1 1v6.4a1 1 0 0 1-.3.7l-7.9 7.9a1 1 0 0 1-1.4 0L2 11.6a1 1 0 0 1 0-1.4l7.9-7.9a1 1 0 0 1 .7-.3Zm3.9 2.3a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4Z" /></svg>
  ),
  toc: (
    <svg {...base}><path d="M3 4h2v2H3V4Zm4 0h10v2H7V4ZM3 9h2v2H3V9Zm4 0h10v2H7V9Zm-4 5h2v2H3v-2Zm4 0h10v2H7v-2Z" /></svg>
  ),
  users: (
    <svg {...base}><path d="M10 3a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7Zm0 8.5c3.6 0 6.5 1.8 6.5 4V17h-13v-1.5c0-2.2 2.9-4 6.5-4Z" /></svg>
  ),
  settings: (
    <svg {...base}><path d="m11.2 2 .4 2.1 1.4.6 1.8-1.2 1.7 1.7-1.2 1.8.6 1.4 2.1.4v2.4l-2.1.4-.6 1.4 1.2 1.8-1.7 1.7-1.8-1.2-1.4.6-.4 2.1H8.8l-.4-2.1-1.4-.6-1.8 1.2-1.7-1.7 1.2-1.8-.6-1.4L2 11.2V8.8l2.1-.4.6-1.4-1.2-1.8 1.7-1.7 1.8 1.2 1.4-.6L8.8 2h2.4ZM10 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" /></svg>
  ),
  collapse: (
    <svg {...base}><path d="M10 2a8 8 0 1 1 0 16 8 8 0 0 1 0-16Zm1.5 4L7.5 10l4 4V6Z" /></svg>
  ),
  home: (
    <svg {...base}><path d="M10 3 2 10h2.5v7h4.5v-4.5h2V17h4.5v-7H18l-8-7Z" /></svg>
  ),
  plus: (
    <svg {...base}><path d="M9 4h2v5h5v2h-5v5H9v-5H4V9h5V4Z" /></svg>
  ),
  menu: (
    <svg {...base}><path d="M3 5h14v2H3V5Zm0 4h14v2H3V9Zm0 4h14v2H3v-2Z" /></svg>
  ),
  calendar: (
    <svg {...base}><path d="M5 2h2v2h6V2h2v2h2v13H3V4h2V2Zm-.5 6v7.5h11V8h-11Z" /></svg>
  ),
  eye: (
    <svg {...base}><path d="M10 5c4 0 7 3.5 8 5-1 1.5-4 5-8 5s-7-3.5-8-5c1-1.5 4-5 8-5Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" /></svg>
  ),
  pin: (
    <svg {...base}><path d="M10 2a5 5 0 0 1 5 5c0 4-5 11-5 11S5 11 5 7a5 5 0 0 1 5-5Zm0 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z" /></svg>
  ),
  chevron: (
    <svg {...base}><path d="m5 7 5 5 5-5H5Z" /></svg>
  ),
};
