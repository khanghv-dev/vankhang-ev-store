using MediatR;
using VinFastO2O.OrderService.Application.Common.Interfaces;
using VinFastO2O.OrderService.Domain.Entities;

namespace VinFastO2O.OrderService.Application.Auth.Commands;

public record GoogleLoginCommand(
    string Email,
    string? Name,
    string? PictureUrl
) : IRequest<LoginUserResult>;

public sealed class GoogleLoginCommandHandler
    : IRequestHandler<GoogleLoginCommand, LoginUserResult>
{
    private readonly IUserRepository  _userRepository;
    private readonly IJwtTokenService _jwtTokenService;

    public GoogleLoginCommandHandler(
        IUserRepository  userRepository,
        IJwtTokenService jwtTokenService)
    {
        _userRepository  = userRepository;
        _jwtTokenService = jwtTokenService;
    }

    public async Task<LoginUserResult> Handle(
        GoogleLoginCommand request,
        CancellationToken  cancellationToken)
    {
        var normalisedEmail = request.Email.Trim().ToLowerInvariant();

        // 1. Check if user already exists in DB
        var user = await _userRepository.FindByEmailAsync(normalisedEmail, cancellationToken);

        if (user is null)
        {
            // 2. Auto-register new user for Google login with random secure hash
            var randomPasswordHash = BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString("N"));
            user = new User(Guid.NewGuid(), normalisedEmail, randomPasswordHash);
            user.ConfirmGoogleLogin();

            await _userRepository.AddAsync(user, cancellationToken);
        }
        else if (!user.IsEmailConfirmed)
        {
            // Auto confirm email for Google OAuth users
            user.ConfirmGoogleLogin();
            await _userRepository.UpdateAsync(user, cancellationToken);
        }

        // 3. Issue JWT access token
        var (token, expiresAt) = _jwtTokenService.GenerateToken(user.UserId, user.Email);

        return new LoginUserResult(
            UserId:      user.UserId,
            Email:       user.Email,
            AccessToken: token,
            ExpiresAt:   expiresAt);
    }
}
