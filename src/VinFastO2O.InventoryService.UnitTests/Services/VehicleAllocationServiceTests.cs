using System;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Moq;
using VinFastO2O.InventoryService.Application.Common.Interfaces;
using VinFastO2O.InventoryService.Application.Services;
using VinFastO2O.InventoryService.Domain.Entities;
using VinFastO2O.InventoryService.Domain.Enums;
using VinFastO2O.InventoryService.Domain.ValueObjects;
using Xunit;

namespace VinFastO2O.InventoryService.UnitTests.Services;

public class VehicleAllocationServiceTests
{
    private readonly Mock<ICatalogService> _catalogServiceMock;
    private readonly Mock<IVehicleRepository> _vehicleRepositoryMock;
    private readonly Mock<IStoreRepository> _storeRepositoryMock;
    private readonly Mock<IInventoryLogRepository> _inventoryLogRepositoryMock;
    private readonly VehicleAllocationService _service;

    public VehicleAllocationServiceTests()
    {
        _catalogServiceMock = new Mock<ICatalogService>();
        _vehicleRepositoryMock = new Mock<IVehicleRepository>();
        _storeRepositoryMock = new Mock<IStoreRepository>();
        _inventoryLogRepositoryMock = new Mock<IInventoryLogRepository>();

        _service = new VehicleAllocationService(
            _catalogServiceMock.Object,
            _vehicleRepositoryMock.Object,
            _storeRepositoryMock.Object,
            _inventoryLogRepositoryMock.Object
        );
    }

    private Vehicle CreateTestVehicle(VehicleStatus status, string vinStr = "VF8TEST1234567890")
    {
        return new Vehicle(
            VehicleId.New(),
            new Vin(vinStr),
            new EngineNumber("ENG12345678"),
            "VF8",
            "Red",
            "VinFast",
            1000000000,
            "LFP",
            status
        );
    }

    private Store CreateTestStore(Guid id)
    {
        return new Store(
            new StoreId(id),
            "VinFast HCMC",
            "VF_HCMC",
            "123 Nguyen Hue"
        );
    }

    [Fact]
    public async Task ReserveVinAsync_ShouldReserveVehicle_WhenVehicleIsAvailable()
    {
        // Arrange
        var vinStr = "VF8TEST1234567890";
        var storeId = Guid.NewGuid();
        var performedBy = "SalesStaff01";
        
        var vehicle = CreateTestVehicle(VehicleStatus.Available, vinStr);
        var store = CreateTestStore(storeId);

        _vehicleRepositoryMock
            .Setup(repo => repo.GetByVinAsync(It.Is<Vin>(v => v.Value == vinStr), It.IsAny<CancellationToken>()))
            .ReturnsAsync(vehicle);

        _storeRepositoryMock
            .Setup(repo => repo.GetByIdAsync(It.Is<StoreId>(s => s.Value == storeId), It.IsAny<CancellationToken>()))
            .ReturnsAsync(store);

        // Act
        var result = await _service.ReserveVinAsync(vinStr, storeId, performedBy, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Vin.Should().Be(vinStr);
        result.Status.Should().Be(VehicleStatus.Reserved.ToString());
        result.StoreId.Should().Be(storeId);

        vehicle.Status.Should().Be(VehicleStatus.Reserved);
        vehicle.StoreId.Should().Be(new StoreId(storeId));

        _vehicleRepositoryMock.Verify(repo => repo.UpdateAsync(vehicle, It.IsAny<CancellationToken>()), Times.Once);
        _inventoryLogRepositoryMock.Verify(repo => repo.AddAsync(It.IsAny<InventoryLog>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ReserveVinAsync_ShouldThrowInvalidOperationException_WhenVehicleIsAlreadySold()
    {
        // Arrange
        var vinStr = "VF8TEST1234567890";
        var storeId = Guid.NewGuid();
        var vehicle = CreateTestVehicle(VehicleStatus.Sold, vinStr);

        _vehicleRepositoryMock
            .Setup(repo => repo.GetByVinAsync(It.Is<Vin>(v => v.Value == vinStr), It.IsAny<CancellationToken>()))
            .ReturnsAsync(vehicle);

        // Act
        Func<Task> act = async () => await _service.ReserveVinAsync(vinStr, storeId, "System", CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage($"*{vinStr}*đã được bán (SOLD)*");

        _vehicleRepositoryMock.Verify(repo => repo.UpdateAsync(It.IsAny<Vehicle>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task ReserveVinAsync_ShouldThrowInvalidOperationException_WhenVehicleIsAlreadyReserved()
    {
        // Arrange
        var vinStr = "VF8TEST1234567890";
        var storeId = Guid.NewGuid();
        var vehicle = CreateTestVehicle(VehicleStatus.Reserved, vinStr);

        _vehicleRepositoryMock
            .Setup(repo => repo.GetByVinAsync(It.Is<Vin>(v => v.Value == vinStr), It.IsAny<CancellationToken>()))
            .ReturnsAsync(vehicle);

        // Act
        Func<Task> act = async () => await _service.ReserveVinAsync(vinStr, storeId, "System", CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage($"*{vinStr}*đã được giữ (RESERVED)*");
    }

    [Theory]
    [InlineData(VehicleStatus.Maintenance)]
    [InlineData(VehicleStatus.Damaged)]
    public async Task ReserveVinAsync_ShouldThrowInvalidOperationException_WhenVehicleIsUnserviceable(VehicleStatus unserviceableStatus)
    {
        // Arrange
        var vinStr = "VF8TEST1234567890";
        var storeId = Guid.NewGuid();
        var vehicle = CreateTestVehicle(unserviceableStatus, vinStr);

        _vehicleRepositoryMock
            .Setup(repo => repo.GetByVinAsync(It.Is<Vin>(v => v.Value == vinStr), It.IsAny<CancellationToken>()))
            .ReturnsAsync(vehicle);

        // Act
        Func<Task> act = async () => await _service.ReserveVinAsync(vinStr, storeId, "System", CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage($"*không thể giữ kho*trạng thái {unserviceableStatus}*");
    }

    [Fact]
    public async Task ReserveVinAsync_ShouldThrowKeyNotFoundException_WhenVehicleDoesNotExist()
    {
        // Arrange
        var vinStr = "NONEXISTENTVIN999";
        var storeId = Guid.NewGuid();

        _vehicleRepositoryMock
            .Setup(repo => repo.GetByVinAsync(It.IsAny<Vin>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Vehicle?)null);

        // Act
        Func<Task> act = async () => await _service.ReserveVinAsync(vinStr, storeId, "System", CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<KeyNotFoundException>()
            .WithMessage($"*Không tìm thấy xe với số VIN: {vinStr}*");
    }

    [Fact]
    public async Task ReserveVinAsync_ShouldThrowKeyNotFoundException_WhenStoreDoesNotExist()
    {
        // Arrange
        var vinStr = "VF8TEST1234567890";
        var storeId = Guid.NewGuid();
        var vehicle = CreateTestVehicle(VehicleStatus.Available, vinStr);

        _vehicleRepositoryMock
            .Setup(repo => repo.GetByVinAsync(It.Is<Vin>(v => v.Value == vinStr), It.IsAny<CancellationToken>()))
            .ReturnsAsync(vehicle);

        _storeRepositoryMock
            .Setup(repo => repo.GetByIdAsync(It.Is<StoreId>(s => s.Value == storeId), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Store?)null);

        // Act
        Func<Task> act = async () => await _service.ReserveVinAsync(vinStr, storeId, "System", CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<KeyNotFoundException>()
            .WithMessage($"*Không tìm thấy showroom/cửa hàng với ID {storeId}*");
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public async Task ReserveVinAsync_ShouldThrowArgumentException_WhenVinIsEmpty(string? invalidVin)
    {
        // Act
        Func<Task> act = async () => await _service.ReserveVinAsync(invalidVin!, Guid.NewGuid(), "System", CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage("*VIN*");
    }
}
