using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System;
using EvO2O.OrderService.API.Authentication;

namespace EvO2O.OrderService.API.Controllers;

/// <summary>
/// Administrative endpoints for managing vehicle fleet resources.
/// </summary>
[ApiController]
[Route("api/admin/vehicles")]
[Produces("application/json")]
public sealed class AdminVehicleController : ControllerBase
{
    private readonly ILogger<AdminVehicleController> _logger;

    public AdminVehicleController(ILogger<AdminVehicleController> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Updates listing prices for vehicles. Protected by granular RBAC permissions.
    /// </summary>
    /// <response code="200">Price updated successfully.</response>
    /// <response code="400">Invalid payload inputs.</response>
    /// <response code="401">Missing or invalid JWT token.</response>
    /// <response code="403">Authenticated user lacks the required permission (edit_vehicle_price).</response>
    [HttpPost("price")]
    [HasPermission("edit_vehicle_price")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public IActionResult UpdatePrice([FromBody] UpdateVehiclePriceRequestDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Vin))
        {
            return BadRequest(new { message = "Số VIN không được để trống." });
        }

        if (dto.NewPrice <= 0)
        {
            return BadRequest(new { message = "Giá xe mới phải lớn hơn 0." });
        }

        _logger.LogInformation(
            "[AdminVehicle] Updated vehicle price successfully — VIN: {Vin} | NewPrice: {NewPrice} VND",
            dto.Vin, dto.NewPrice);

        return Ok(new
        {
            vin = dto.Vin,
            newPrice = dto.NewPrice,
            updatedAt = DateTime.UtcNow,
            message = $"Cập nhật giá xe thành công cho VIN {dto.Vin}."
        });
    }
}

public record UpdateVehiclePriceRequestDto(string Vin, decimal NewPrice);
