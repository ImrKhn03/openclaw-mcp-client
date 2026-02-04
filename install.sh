#!/bin/bash
# OpenClaw MCP Client Installer
# Built by Toki 🦞

set -e  # Exit on error

echo "🦞 OpenClaw MCP Client Installer"
echo "=================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check Node.js
echo -n "Checking Node.js... "
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ FAILED${NC}"
    echo ""
    echo "Node.js not found. Please install Node.js >= 18"
    echo "Visit: https://nodejs.org/"
    exit 1
fi

# Check version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ FAILED${NC}"
    echo ""
    echo "Node.js version must be >= 18 (current: $(node -v))"
    echo "Please upgrade Node.js"
    exit 1
fi

echo -e "${GREEN}✅ $(node -v)${NC}"

# Check npm
echo -n "Checking npm... "
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ FAILED${NC}"
    echo ""
    echo "npm not found. Please install npm"
    exit 1
fi
echo -e "${GREEN}✅ $(npm -v)${NC}"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found${NC}"
    echo "Please run this script from the openclaw-mcp-client directory"
    exit 1
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install --production

# Check installation
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Installation failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Dependencies installed${NC}"

# Run verification
echo ""
echo "🔍 Verifying installation..."
if [ -f "scripts/verify-install.js" ]; then
    node scripts/verify-install.js
else
    echo -e "${YELLOW}⚠️  Verification script not found, skipping...${NC}"
fi

# Create .oauth-tokens.json if it doesn't exist
if [ ! -f ".oauth-tokens.json" ]; then
    echo "{}" > .oauth-tokens.json
    echo -e "${GREEN}✅ Created .oauth-tokens.json${NC}"
fi

# Make scripts executable
chmod +x install.sh 2>/dev/null || true
chmod +x scripts/*.js 2>/dev/null || true

echo ""
echo -e "${GREEN}✅ Installation complete!${NC}"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}Next Steps:${NC}"
echo ""
echo "1. Review available servers:"
echo -e "   ${YELLOW}ls servers/${NC}"
echo ""
echo "2. Check OAuth status:"
echo -e "   ${YELLOW}npm run oauth:status${NC}"
echo ""
echo "3. Set up OAuth for a server (e.g., Swiggy):"
echo -e "   ${YELLOW}npm run oauth swiggy-food${NC}"
echo ""
echo "4. List available tools:"
echo -e "   ${YELLOW}npm run list-tools${NC}"
echo ""
echo "5. Try an example:"
echo -e "   ${YELLOW}npm run shop-groceries${NC}"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "📖 Documentation:"
echo "   README.md - Overview"
echo "   QUICKSTART.md - Quick start guide"
echo "   USAGE.md - Detailed usage"
echo "   TODO.md - Development tasks"
echo ""
echo -e "Built by ${GREEN}Toki 🦞${NC} for the OpenClaw community"
echo ""
