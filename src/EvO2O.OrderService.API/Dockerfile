# Base runtime image
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

# SDK build image
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy csproj files for dependency caching
COPY ["EvO2O.OrderService.API/EvO2O.OrderService.API.csproj", "EvO2O.OrderService.API/"]
COPY ["EvO2O.OrderService.Infrastructure/EvO2O.OrderService.Infrastructure.csproj", "EvO2O.OrderService.Infrastructure/"]
COPY ["EvO2O.OrderService.Application/EvO2O.OrderService.Application.csproj", "EvO2O.OrderService.Application/"]
COPY ["EvO2O.OrderService.Domain/EvO2O.OrderService.Domain.csproj", "EvO2O.OrderService.Domain/"]

# Restore packages
RUN dotnet restore "EvO2O.OrderService.API/EvO2O.OrderService.API.csproj"

# Copy the remaining source files and compile
COPY . .
WORKDIR "/src/EvO2O.OrderService.API"
RUN dotnet build "EvO2O.OrderService.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "EvO2O.OrderService.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Final runtime environment
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "EvO2O.OrderService.API.dll"]
