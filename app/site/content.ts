export const officialImages = {
  hero: "https://static.wixstatic.com/media/d8edaa_96c873e7fe074781a638d1e080ca2a0b~mv2.png/v1/fit/w_2500,h_1330,al_c,q_90/d8edaa_96c873e7fe074781a638d1e080ca2a0b~mv2.png",
  community: "https://static.wixstatic.com/media/d8edaa_bc1768cf4f164aef92f673e53fcf4336~mv2.jpg/v1/fill/w_1600,h_1000,al_c,q_90/d8edaa_bc1768cf4f164aef92f673e53fcf4336~mv2.jpg",
  stage: "https://static.wixstatic.com/media/d8edaa_8f163e2a9d3e466cab992bfe2ed9ed1e~mv2.png/v1/fill/w_1400,h_900,al_c,q_90/d8edaa_8f163e2a9d3e466cab992bfe2ed9ed1e~mv2.png",
  travel: "https://static.wixstatic.com/media/d8edaa_e7b941f2c3844ddd8aedd42821c0b449~mv2.png/v1/fill/w_1400,h_900,al_c,q_90/d8edaa_e7b941f2c3844ddd8aedd42821c0b449~mv2.png",
  orchestra: "https://static.wixstatic.com/media/d8edaa_6de39671de844d7e8566d56411634b75~mv2.png/v1/fill/w_1600,h_900,al_c,q_90/d8edaa_6de39671de844d7e8566d56411634b75~mv2.png",
};

export const leaders = [
  { name: "Avery Chen", role: "Youth President · Violin", image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=700&q=85" },
  { name: "Ethan Lin", role: "Program Lead · Cello", image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=700&q=85" },
  { name: "Mia Patel", role: "Community Lead · Piano", image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=700&q=85" },
  { name: "Lucas Park", role: "Mentorship Lead · Viola", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=700&q=85" },
];

export const programs = [
  { number: "01", title: "Music Exchange", text: "Sharing sheet music, music books, and learning resources with the community.", image: officialImages.travel },
  { number: "02", title: "Free Music Workshops", text: "Making joyful, high-quality music education more accessible to every learner.", image: officialImages.community },
  { number: "03", title: "Community Performances", text: "Bringing live music to senior centers, schools, hospitals, and public spaces.", image: officialImages.hero },
  { number: "04", title: "Youth Mentorship", text: "Young musicians helping the next generation find confidence and grow.", image: officialImages.stage },
];

export const stories = [
  { tag: "Volunteer voice", title: "The afternoon our music became a conversation", excerpt: "A reflection on sharing familiar melodies with seniors—and discovering how memory can sing back.", author: "Youth Volunteer", date: "May 18, 2026", image: officialImages.community },
  { tag: "In the community", title: "Small hands, first notes, big courage", excerpt: "Inside a beginner workshop where mentors helped twelve new musicians play their first song.", author: "Program Team", date: "April 28, 2026", image: officialImages.stage },
  { tag: "Music beyond borders", title: "One stage, many languages", excerpt: "What we learned when a shared score connected young performers across cities and cultures.", author: "Student Contributor", date: "March 09, 2026", image: officialImages.travel },
];

export const upcomingEvents = [
  { day: "24", month: "AUG", title: "Summer Music Exchange Sorting Day", location: "Yorba Linda Community Center", spots: 12, time: "10:00 AM – 1:00 PM" },
  { day: "07", month: "SEP", title: "Young Strings Workshop", location: "OC Music & Dance", spots: 8, time: "2:00 PM – 4:30 PM" },
  { day: "21", month: "SEP", title: "Sunset Senior Center Performance", location: "Placentia, CA", spots: 6, time: "3:30 PM – 5:00 PM" },
];
