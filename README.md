# Cinema Distributed System (Microservices + Blockchain)

A fully distributed cinema reservation platform built using:

- **Node.js / Express** microservices  
- **RabbitMQ** for asynchronous event-driven communication  
- **PostgreSQL** (database-per-service pattern)  
- **Custom Blockchain Layer** for tamper-proof event logging  
- **Dockerized** architecture (optional)

---

## Microservices Overview

### **Auth Service**
- Handles user registration, login, JWT authentication.

### **Movie Service**
- Manages movies, halls, showtimes, seat layouts.

### **Booking Service**
- Handles cart → booking conversion.
- Listens to `payment.success` events.
- Creates bookings and assigns seats.

### **Payment Service**
- Records payments.
- Publishes `payment.success` events → Booking & Movie services.
- Adds blockchain blocks for every successful payment.

### **Blockchain Service**
- Mini blockchain cluster (multiple nodes).
- Uses:
  - ECDSA signatures  
  - Merkle Tree  
  - PBFT-like 3-phase consensus  
- Records:
  - Booking events  
  - Payment events  

---

## Architecture Diagram (High-Level)

```
Client → API Gateway → Microservices → RabbitMQ → Blockchain Nodes → PostgreSQL
```

---

## Event Flow Example (Payment)

1. User checks out → Payment Service creates a pending payment.  
2. Payment is marked **Success**.  
3. Payment Service publishes **payment.success** event.  
4. Booking Service:
   - Creates booking.
   - Assigns seats.
   - Sends event to Blockchain Service.
5. Movie Service:
   - Marks seats as booked (idempotent).
6. Blockchain Service:
   - Adds block for payment + booking.

---

## Project Structure

```
cinema-distributed/
   auth-service/
   movie-service/
   booking-service/
   payment-service/
   blockchain-service/
   docker-compose.yml (optional)
   README.md
```

---

## How to Run (Development Mode)

Each service runs on its own port:

- Auth → 4001  
- Movie → 4002  
- Booking → 4003  
- Blockchain → 4006  
- Payment → 4005  

Setup each service:

```bash
cd auth-service
npm install
npm start
```

Repeat for all services.

---

## Environment Variables

Each service must have its own `.env` file:

Example:

```
PORT=
DATABASE_URL=
JWT_SECRET=
RABBITMQ_URL=
RABBITMQ_EXCHANGE=cinema.events
```

You can create a `.env.example` file for visibility.

---

## Testing

- Test booking flow  
- Test payment.success event  
- Test blockchain block creation  
- Test seat reservation idempotency  

---

## Author

**Roukaya Mazloum**  
Distributed Systems Project — 2025  
Antonine University  

---

## License

Academic project — Not for commercial use.
