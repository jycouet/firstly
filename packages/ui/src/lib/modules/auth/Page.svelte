<script lang="ts">
	import { Link, Route } from 'svelte-micro'

	import type { FirstlyData } from '../../../../../firstly/src/lib/auth/types'
	import ForgotPassword from './components/ForgotPassword.svelte'
	import ResetPassword from './components/ResetPassword.svelte'
	import SignIn from './components/SignIn.svelte'
	import SignUp from './components/SignUp.svelte'

	// import Flows from './components/Flows.svelte'

	export let firstlyData: FirstlyData
	let firstlyDataAuth = firstlyData.props

	let email = ''

	// Check if main image is provided
	$: hasMainImage = !!firstlyDataAuth.ui?.images?.main
</script>

<div class="wrapper" class:with-image={hasMainImage}>
	<Route>
		{#if hasMainImage}
			<div class="split-layout">
				<div class="form-side">
					<div class="form">
						{#if firstlyDataAuth.ui?.strings.app_name}
							<h1>{firstlyDataAuth.ui.strings.app_name}</h1>
						{/if}

						{#if firstlyDataAuth.ui?.paths.sign_up}
							<Route path={firstlyDataAuth.ui?.paths.sign_up}>
								<SignUp {firstlyDataAuth} bind:email />

								<div class="form-footer">
									{#if firstlyDataAuth.ui.paths.sign_in}
										<Link href={firstlyDataAuth.ui.paths.sign_in}>
											{firstlyDataAuth.ui.strings.back_to_sign_in}
										</Link>
									{/if}
								</div>
							</Route>
						{/if}

						{#if firstlyDataAuth.ui?.paths.sign_in}
							<Route path={firstlyDataAuth.ui?.paths.sign_in}>
								<SignIn {firstlyDataAuth} bind:email />

								<div class="form-footer">
									{#if firstlyDataAuth.ui?.paths.forgot_password}
										<Link href={firstlyDataAuth.ui.paths.forgot_password}>
											{firstlyDataAuth.ui.strings.forgot_password}
										</Link>
									{/if}
									{#if firstlyDataAuth.ui?.paths.sign_up}
										<hr />
										<Link href={firstlyDataAuth.ui.paths.sign_up}>
											{firstlyDataAuth.ui.strings.btn_sign_up}
										</Link>
									{/if}
								</div>
							</Route>
						{/if}

						{#if firstlyDataAuth.ui?.paths.forgot_password}
							<Route path={firstlyDataAuth.ui?.paths.forgot_password}>
								<ForgotPassword {firstlyDataAuth} bind:email />

								<div class="form-footer">
									{#if firstlyDataAuth.ui?.paths.sign_in}
										<Link href={firstlyDataAuth.ui.paths.sign_in}>
											{firstlyDataAuth.ui.strings.back_to_sign_in}
										</Link>
									{/if}
								</div>
							</Route>
						{/if}

						{#if firstlyDataAuth.ui?.paths.reset_password}
							<Route path={firstlyDataAuth.ui?.paths.reset_password}>
								<ResetPassword {firstlyDataAuth} />

								<div class="form-footer">
									{#if firstlyDataAuth.ui?.paths.sign_in}
										<Link href={firstlyDataAuth.ui.paths.sign_in}>
											{firstlyDataAuth.ui.strings.back_to_sign_in}
										</Link>
									{/if}
								</div>
							</Route>
						{/if}

						<!-- {#if firstlyData.debug}
              <Route path={'/ff/auth/flows'}>
                <Flows {firstlyDataAuth} />
              </Route>

              <Link href={'/ff/auth/flows'}>Flows</Link>
            {/if} -->
					</div>
				</div>

				<div class="image-side">
					{#if firstlyDataAuth.ui?.images?.main}
						<img src={firstlyDataAuth.ui.images.main} alt="Authentication" />
					{/if}
				</div>
			</div>
		{:else}
			<div class="centered-layout">
				<div class="form">
					{#if firstlyDataAuth.ui?.strings.app_name}
						<h1>{firstlyDataAuth.ui.strings.app_name}</h1>
					{/if}

					{#if firstlyDataAuth.ui?.paths.sign_up}
						<Route path={firstlyDataAuth.ui?.paths.sign_up}>
							<SignUp {firstlyDataAuth} bind:email />

							<div class="form-footer">
								{#if firstlyDataAuth.ui.paths.sign_in}
									<Link href={firstlyDataAuth.ui.paths.sign_in}>
										{firstlyDataAuth.ui.strings.back_to_sign_in}
									</Link>
								{/if}
							</div>
						</Route>
					{/if}

					{#if firstlyDataAuth.ui?.paths.sign_in}
						<Route path={firstlyDataAuth.ui?.paths.sign_in}>
							<SignIn {firstlyDataAuth} bind:email />

							<div class="form-footer">
								{#if firstlyDataAuth.ui?.paths.forgot_password}
									<Link href={firstlyDataAuth.ui.paths.forgot_password}>
										{firstlyDataAuth.ui.strings.forgot_password}
									</Link>
								{/if}
								{#if firstlyDataAuth.ui?.paths.sign_up}
									<hr />
									<Link href={firstlyDataAuth.ui.paths.sign_up}>
										{firstlyDataAuth.ui.strings.btn_sign_up}
									</Link>
								{/if}
							</div>
						</Route>
					{/if}

					{#if firstlyDataAuth.ui?.paths.forgot_password}
						<Route path={firstlyDataAuth.ui?.paths.forgot_password}>
							<ForgotPassword {firstlyDataAuth} bind:email />

							<div class="form-footer">
								{#if firstlyDataAuth.ui?.paths.sign_in}
									<Link href={firstlyDataAuth.ui.paths.sign_in}>
										{firstlyDataAuth.ui.strings.back_to_sign_in}
									</Link>
								{/if}
							</div>
						</Route>
					{/if}

					{#if firstlyDataAuth.ui?.paths.reset_password}
						<Route path={firstlyDataAuth.ui?.paths.reset_password}>
							<ResetPassword {firstlyDataAuth} />

							<div class="form-footer">
								{#if firstlyDataAuth.ui?.paths.sign_in}
									<Link href={firstlyDataAuth.ui.paths.sign_in}>
										{firstlyDataAuth.ui.strings.back_to_sign_in}
									</Link>
								{/if}
							</div>
						</Route>
					{/if}

					<!-- {#if firstlyData.debug}
            <Route path={'/ff/auth/flows'}>
              <Flows {firstlyDataAuth} />
            </Route>

            <Link href={'/ff/auth/flows'}>Flows</Link>
          {/if} -->
				</div>
			</div>
		{/if}

		<Route fallback>
			<div class="fallback">
				<small>- 404 -</small>
			</div>
			<div class="fallback">
				<small>Nothing to see here</small>
			</div>
		</Route>
	</Route>
</div>

<style>
	h1 {
		text-align: center;
		margin-bottom: 2rem;
	}

	.wrapper {
		min-height: 100vh;
		display: flex;
		justify-content: center;
		align-items: center;
		margin: 0 auto;
	}

	/* Centered layout (no image) */
	.centered-layout {
		display: flex;
		justify-content: center;
		align-items: center;
		width: 100%;
	}

	/* Split layout (with image) */
	.split-layout {
		display: flex;
		width: 100%;
		min-height: 100vh;
	}

	.form-side {
		width: 50%;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.image-side {
		width: 50%;
		height: 100vh;
		overflow: hidden;
	}

	.image-side img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.form {
		max-width: 360px;
		width: 100%;
		padding: 1rem;
		display: flex;
		flex-direction: column;
	}

	.form-footer {
		margin-top: 1rem;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
	}

	.fallback {
		display: flex;
		justify-content: center;
		align-items: center;
	}

	/* Responsive adjustments */
	@media (max-width: 768px) {
		.split-layout {
			flex-direction: column;
		}

		.form-side {
			width: 100%;
			order: 2;
		}

		.image-side {
			width: 100%;
			height: 50vh;
			order: 1;
		}

		.form {
			max-width: 100%;
		}
	}
</style>
