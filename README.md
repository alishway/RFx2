# RFx Dev Assist

**Streamline your procurement process with AI-powered assistance**

## About This Project

RFx Dev Assist is a comprehensive procurement management application that helps organizations streamline their RFP (Request for Proposal), RFQ (Request for Quote), and RFI (Request for Information) processes using AI-powered assistance.

## Features

- **AI-Powered Intake Forms**: Intelligent form generation and validation
- **Role-Based Access Control**: Different user roles (End User, Procurement Lead, Approver, Admin)
- **Real-time Collaboration**: Chat-based requirement refinement
- **Document Management**: File upload and attachment handling
- **Audit Trail**: Complete tracking of all changes and approvals
- **Dashboard Views**: Customized dashboards for different user roles

## Getting Started

### Prerequisites

- Node.js 18+ and npm (install with [nvm](https://github.com/nvm-sh/nvm#installing-and-updating))
- Supabase account for backend services

### Installation

```sh
# Clone the repository
git clone https://github.com/alishway/RFx2.git

# Navigate to the project directory
cd RFx2

# Install dependencies
npm install

# Start the development server
npm run dev
```

### Environment Setup

Create a `.env` file with your Supabase credentials:

```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Technologies Used

- **Frontend**: React, TypeScript, Vite
- **UI Components**: shadcn/ui, Tailwind CSS
- **Backend**: Supabase (Database, Authentication, Storage)
- **State Management**: React Query (TanStack Query)
- **Routing**: React Router

## Deployment

The application can be deployed to any static hosting service:

- **Vercel** (recommended)
- **Netlify** 
- **AWS S3 + CloudFront**
- **GitHub Pages**

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the GitHub repository.
