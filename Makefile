name = ft_transcendence

COMPOSE = docker compose -f ./docker-compose.yml --env-file .env

all: start

start: build
	@printf "${BOLD}${GREEN}${ROCKET} Starting ${name} (production)...${RESET}\n"
	@$(COMPOSE) up -d

dev:
	@printf "${BOLD}${CYAN}${ROCKET} Starting ${name} (development)...${RESET}\n"
	@$(COMPOSE) up --build -d

dev-re: down dev

build:
	@printf "${BOLD}${YELLOW}${GEAR} Building ${name}...${RESET}\n"
	@$(COMPOSE) build

up:
	@printf "${BOLD}${GREEN}${UP} Starting ${name}...${RESET}\n"
	@$(COMPOSE) up -d

down:
	@printf "${BOLD}${RED}${DOWN} Stopping ${name}...${RESET}\n"
	@$(COMPOSE) down

re: down build up

logs:
	@$(COMPOSE) logs -f

ps:
	@$(COMPOSE) ps

clean:
	@printf "${BOLD}${RED}${CLEAN} Cleaning containers and images...${RESET}\n"
	@$(COMPOSE) down --rmi local
fclean:
	@printf "${BOLD}${RED}${CLEAN} Removing everything including volumes...${RESET}\n"
	@$(COMPOSE) down -v --rmi local

.PHONY: all start dev dev-re build up down re logs ps clean fclean

# Colors
RED    = \033[0;31m
GREEN  = \033[0;32m
YELLOW = \033[1;33m
BLUE   = \033[0;34m
CYAN   = \033[0;36m
BOLD   = \033[1m
RESET  = \033[0m

# Emojis
ROCKET  = 🚀
GEAR    = ⚙️ 
UP      = ⬆️ 
DOWN    = ⬇️ 
CLEAN   = 🧹
WARNING = ⚠️
