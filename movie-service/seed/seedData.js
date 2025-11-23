// movie-service/seed/seedData.js
const pool = require('../config/db');

async function seedData() {
  try {
    console.log('🚀 Starting movie_db seeding...');

    // 1️⃣ Insert Halls
    await pool.query(`
      INSERT INTO halls (hall_id, name, capacity, description, created_at, base_price) VALUES
      (1, 'Hall A', 120, 'Standard screen with surround sound', '2025-07-17 10:55:23', 10.00),
      (2, 'Hall B', 90, 'Dolby Atmos sound system', '2025-07-17 10:55:23', 10.00),
      (3, 'Hall C', 150, 'IMAX experience with 3D support', '2025-07-17 10:55:23', 10.00),
      (4, 'Hall D', 80, 'VIP lounge with recliner seats', '2025-07-17 10:55:23', 10.00)
      ON CONFLICT (hall_id) DO NOTHING;
    `);

    // 2️⃣ Insert Movies
    await pool.query(`
      INSERT INTO movies (movie_id, title, genre, duration, description, rating, release_date, poster_url, price_multiplier) VALUES
      (1, 'Inception', 'Sci-Fi', 148, 'A thief who steals corporate secrets through dream-sharing tech.', 8.8, '2010-07-16', 'https://m.media-amazon.com/images/I/81p+xe8cbnL._AC_SY679_.jpg', 1.00),
      (2, 'Dune: Part Two', 'Adventure', 165, 'The saga continues as Paul unites with the Fremen.', 8.4, '2025-07-20', 'https://encrypted-tbn3.gstatic.com/images?q=tbn:ANd9GcRBu8Gzdygf5OOqBJUIJ3-ZxiPbLh62OhvLmtOvuR7x2gF3DucU', 1.00),
      (3, 'The Pulse', 'Sci-Fi', 128, 'In a world where memories can be streamed, a rogue engineer fights to reclaim reality.', 8.2, '2025-07-15', 'https://m.media-amazon.com/images/I/51TPwZeGnbL.jpg', 1.30),
      (4, 'Oppenheimer', 'Biography, Drama, History', 180, 'A gripping tale of the man behind the atomic bomb.', 8.6, '2023-07-21', 'https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcQ8FFJNBaIXvhEwqXXw40rYYDci8jPlYxWfy9082flliYoZ-SqqZjy0az-G5rIWuSJp2pn7xQ', 1.00),
      (5, 'Lonely Planet', 'Drama, Romance', 105, 'An emotional journey through solitude and discovery.', 7.3, '2024-01-18', 'https://encrypted-tbn1.gstatic.com/images?q=tbn:ANd9GcSvPZWZGPC7IV82Smlf2b7TyUvw0l4QKDVux3a5gCpWxVD0UbkfvhJE4Q_BrOPZ5fsiyK0Y', 1.00),
      (6, 'Fall Guy', 'Action, Comedy', 126, 'A stuntman gets tangled in a real-life action mission.', 7.9, '2024-05-03', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTJhBAFnWk-3tBPBLpibGxRs6h0R9QjLTTcWzmel-IcLmvRHvuk2uZrnBX5I4sGm8L0WZ20', 1.00),
      (7, 'Role Play', 'Mystery, Thriller', 118, 'A couple’s role-playing night turns into a deadly game.', 6.8, '2024-02-10', 'https://encrypted-tbn3.gstatic.com/images?q=tbn:ANd9GcTjc_cuBEdOIWAlrIDdV4RWq8FbHE7XmC-DOOgkZsMx-DoQQKs3ZJTCt5_5bpwK1NWVFQEr', 1.00),
      (8, 'Spiderman', 'Action, Adventure', 140, 'The multiverse challenges Spiderman like never before.', 8.4, '2023-12-15', 'https://cdn.marvel.com/content/1x/snh_online_6072x9000_posed_01.jpg', 1.00),
      (9, 'Fighter', 'Action, War', 130, 'A tribute to Indian Air Force heroes.', 7.5, '2024-01-25', 'https://upload.wikimedia.org/wikipedia/en/d/df/Fighter_film_teaser.jpg', 1.00),
      (10, 'Elemental World', 'Horror, Fantasy', 109, 'An imaginative world where fire, water, earth, and air come to life.', 7.1, '2023-06-16', 'https://i.abcnewsfe.com/a/82633b97-5101-48a7-a598-83bf03cc0420/elemental-movie-poster-02-ht-jt-230602_1685746771359_hpEmbed_2x3.jpg', 1.00),
      (11, 'The Mermaid', 'Animation, Fantasy', 95, 'A chilling horror film that will keep you on the edge of your seat.', 6.9, '2023-10-31', 'https://upload.wikimedia.org/wikipedia/en/f/f4/The_Little_Mermaid_%282023_film%29.png', 1.00)
      ON CONFLICT (movie_id) DO NOTHING;
    `);

    // 3️⃣ Insert Seats (simplified batch)
    await pool.query(`
      INSERT INTO seats (seat_id, row_letter, seat_number, hall_id)
      VALUES 
      (1,'A',1,1),(2,'A',2,1),(3,'A',3,1),(4,'A',4,1),(5,'A',5,1),
      (6,'B',1,1),(7,'B',2,1),(8,'B',3,1),(9,'B',4,1),(10,'B',5,1)
      ON CONFLICT (seat_id) DO NOTHING;
    `);

    // 4️⃣ Insert a few Showtimes (you can expand later)
    await pool.query(`
      INSERT INTO showtimes (showtime_id, movie_id, show_date, start_time, end_time, hall_id, price)
      VALUES
      (1, 1, '2025-07-25', '19:00:00', '21:30:00', 1, 120.00),
      (2, 2, '2025-07-26', '17:00:00', '19:45:00', 1, 95.50),
      (3, 3, '2025-07-28', '18:00:00', '20:08:00', 1, 13.00)
      ON CONFLICT (showtime_id) DO NOTHING;
    `);

    console.log('✅ movie_db seeded successfully!');
  } catch (err) {
    console.error('❌ Error seeding database:', err);
  } finally {
    await pool.end();
  }
}

seedData();
